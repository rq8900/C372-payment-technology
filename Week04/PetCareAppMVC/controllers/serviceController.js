const petModel = require('../models/petModel');
const serviceModel = require('../models/serviceModel');
const serviceBookingModel = require('../models/serviceBookingModel');

const SUCCESS_MESSAGE = 'Booking created. Payment is pending; no payment has been processed.';
const VALIDATION_MESSAGE = 'Choose a pet, service, and valid booking date.';
const UNAVAILABLE_MESSAGE = 'That pet or service is unavailable for booking.';
const SAVE_ERROR_MESSAGE = 'Unable to create the booking. Please try again.';

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parsePositiveInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function isValidBookingDate(value, today) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && value >= today;
}

function getFlashMessages(req) {
  return {
    messages: req.flash('success'),
    errors: req.flash('error')
  };
}

function listServices(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (petError, pets) => {
    if (petError) {
      console.error(petError);
      return res.status(500).send('Unable to load pets.');
    }

    serviceModel.getActiveServices((serviceError, services) => {
      if (serviceError) {
        console.error(serviceError);
        return res.status(500).send('Unable to load services.');
      }

      const requestedPetId = req.query.petId;
      const selectedPetId = typeof requestedPetId === 'string'
        && pets.some(pet => String(pet.id) === requestedPetId)
        ? requestedPetId
        : '';

      return res.render('services', {
        pets,
        services,
        selectedPetId,
        today: getLocalDateString(new Date()),
        ...getFlashMessages(req),
        session: req.session
      });
    });
  });
}

function createBooking(req, res) {
  const body = req.body || {};
  const petId = parsePositiveInteger(body.petId);
  const serviceId = parsePositiveInteger(body.serviceId);
  const today = getLocalDateString(new Date());

  if (petId === null || serviceId === null || !isValidBookingDate(body.bookingDate, today)) {
    req.flash('error', VALIDATION_MESSAGE);
    return res.redirect('/services');
  }

  serviceBookingModel.createPendingBooking(
    req.session.user.id,
    petId,
    serviceId,
    body.bookingDate,
    (bookingError, booking) => {
      if (bookingError) {
        console.error(bookingError);
        req.flash('error', SAVE_ERROR_MESSAGE);
        return res.redirect(`/services?petId=${encodeURIComponent(String(petId))}`);
      }

      if (!booking) {
        req.flash('error', UNAVAILABLE_MESSAGE);
        return res.redirect('/services');
      }

      req.flash('success', SUCCESS_MESSAGE);
      return res.redirect('/bookings');
    }
  );
}

function listBookings(req, res) {
  serviceBookingModel.getBookingsByOwner(req.session.user.id, (error, bookings) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Unable to load booking history.');
    }

    return res.render('bookings', {
      bookings,
      ...getFlashMessages(req),
      session: req.session
    });
  });
}

module.exports = { listServices, createBooking, listBookings };
