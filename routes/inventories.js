var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

const PRODUCT_FIELDS = 'title slug price images category';

// GET all inventories (join với product)
router.get('/', async function (req, res, next) {
  try {
    let data = await inventoryModel.find()
      .populate({
        path: 'product',
        select: PRODUCT_FIELDS
      });
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET inventory by ID (join với product)
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await inventoryModel.findById(id)
      .populate({
        path: 'product',
        select: PRODUCT_FIELDS
      });
    if (!result) {
      return res.status(404).send({ message: 'Inventory not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
