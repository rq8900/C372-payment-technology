const connection = require('../config/db');

function combineErrors(primaryError, cleanupError, cleanupAction) {
  const message = primaryError
    ? `${primaryError.message}; ${cleanupAction} failed: ${cleanupError.message}`
    : `${cleanupAction} failed: ${cleanupError.message}`;
  const error = new Error(message);
  error.cause = primaryError || cleanupError;
  error.cleanupError = cleanupError;
  return error;
}

function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  let bookingConnection;
  let completed = false;

  function finish(error, result) {
    if (completed) return;
    completed = true;

    if (bookingConnection) {
      try {
        bookingConnection.release();
      } catch (releaseError) {
        error = combineErrors(error, releaseError, 'Connection release');
        result = undefined;
      }
    }

    callback(error, result);
  }

  function rollbackAndFinish(error, result) {
    bookingConnection.rollback(rollbackError => {
      if (rollbackError) {
        return finish(combineErrors(error, rollbackError, 'Transaction rollback'));
      }
      finish(error, result);
    });
  }

  connection.getConnection((connectionError, acquiredConnection) => {
    if (connectionError) return finish(connectionError);
    bookingConnection = acquiredConnection;

    bookingConnection.beginTransaction(transactionError => {
      if (transactionError) return finish(transactionError);

      const bookingSql = `
        INSERT INTO service_bookings
          (pet_id, service_id, booking_status, booked_price, booking_date)
        SELECT pets.id, services.id, 'pending', services.price, ?
        FROM pets
        JOIN services ON services.id = ? AND services.is_active = 1
        WHERE pets.id = ? AND pets.owner_id = ?
      `;

      bookingConnection.query(
        bookingSql,
        [bookingDate, serviceId, petId, ownerId],
        (bookingError, bookingResult) => {
          if (bookingError) return rollbackAndFinish(bookingError);
          if (bookingResult.affectedRows === 0) {
            return rollbackAndFinish(null, null);
          }
          if (bookingResult.affectedRows !== 1) {
            return rollbackAndFinish(new Error('Expected exactly one booking to be created.'));
          }

          const bookingId = bookingResult.insertId;
          const paymentSql = `
            INSERT INTO payments (booking_id, amount, payment_status)
            SELECT id, booked_price, 'pending'
            FROM service_bookings
            WHERE id = ?
          `;

          bookingConnection.query(paymentSql, [bookingId], (paymentError, paymentResult) => {
            if (paymentError) return rollbackAndFinish(paymentError);
            if (paymentResult.affectedRows !== 1) {
              return rollbackAndFinish(new Error('Expected exactly one payment to be created.'));
            }

            bookingConnection.commit(commitError => {
              if (commitError) return rollbackAndFinish(commitError);
              finish(null, { bookingId, paymentId: paymentResult.insertId });
            });
          });
        }
      );
    });
  });
}

function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT
      service_bookings.id AS booking_id,
      DATE_FORMAT(service_bookings.booking_date, '%Y-%m-%d') AS booking_date,
      pets.name AS pet_name,
      services.name AS service_name,
      service_bookings.booked_price,
      service_bookings.booking_status,
      payments.payment_status,
      payments.payment_reference,
      service_bookings.created_at
    FROM service_bookings
    JOIN pets ON pets.id = service_bookings.pet_id
    JOIN services ON services.id = service_bookings.service_id
    LEFT JOIN payments ON payments.booking_id = service_bookings.id
    WHERE pets.owner_id = ?
    ORDER BY service_bookings.created_at DESC, service_bookings.id DESC
  `;
  connection.query(sql, [ownerId], callback);
}

module.exports = {
  createPendingBooking,
  getBookingsByOwner
};
