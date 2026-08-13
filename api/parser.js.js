module.exports = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Парсер работает!',
    timestamp: new Date().toISOString()
  });
};
