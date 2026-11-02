const mockServices = require('../data/mockServices');

function preparePayment(req, res) {
  const service = mockServices.find(item => item.id.toString() === req.params.serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.json({
    serviceId: service.id,
    serviceName: service.name,
    amount: service.price,
    currency: 'sgd',
    status: 'READY_FOR_PAYMENT'
  });
}

module.exports = { preparePayment };
