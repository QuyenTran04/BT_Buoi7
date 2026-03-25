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

// POST /add-stock/:idproduct — tăng stock theo product
router.post('/add-stock/:idproduct', async function (req, res, next) {
  try {
    let product = req.params.idproduct;
    let { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).send({ message: 'quantity must be a positive number' });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: product },
      { $inc: { stock: quantity } },
      { new: true }
    ).populate({ path: 'product', select: PRODUCT_FIELDS });

    if (!result) {
      return res.status(404).send({ message: 'Inventory not found for this product' });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// POST /remove-stock — giảm stock theo product
router.post('/remove-stock', async function (req, res, next) {
  try {
    let { product, quantity } = req.body;

    if (!product) {
      return res.status(400).send({ message: 'product is required' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).send({ message: 'quantity must be a positive number' });
    }

    // Kiểm tra stock hiện tại đủ để giảm không
    let inventory = await inventoryModel.findOne({ product: product });
    if (!inventory) {
      return res.status(404).send({ message: 'Inventory not found for this product' });
    }
    if (inventory.stock < quantity) {
      return res.status(400).send({
        message: `Not enough stock. Available: ${inventory.stock}, requested: ${quantity}`
      });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: product },
      { $inc: { stock: -quantity } },
      { new: true }
    ).populate({ path: 'product', select: PRODUCT_FIELDS });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// POST /reservation — giảm stock và tăng reserved theo quantity
router.post('/reservation', async function (req, res, next) {
  try {
    let { product, quantity } = req.body;

    if (!product) {
      return res.status(400).send({ message: 'product is required' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).send({ message: 'quantity must be a positive number' });
    }

    // Kiểm tra stock hiện tại có đủ để reserve không
    let inventory = await inventoryModel.findOne({ product: product });
    if (!inventory) {
      return res.status(404).send({ message: 'Inventory not found for this product' });
    }
    if (inventory.stock < quantity) {
      return res.status(400).send({
        message: `Not enough stock to reserve. Available: ${inventory.stock}, requested: ${quantity}`
      });
    }

    // Giảm stock và tăng reserved trong 1 lần update
    let result = await inventoryModel.findOneAndUpdate(
      { product: product },
      { $inc: { stock: -quantity, reserved: quantity } },
      { new: true }
    ).populate({ path: 'product', select: PRODUCT_FIELDS });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// POST /sold — giảm reserved và tăng soldCount theo quantity
router.post('/sold', async function (req, res, next) {
  try {
    let { product, quantity } = req.body;

    if (!product) {
      return res.status(400).send({ message: 'product is required' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).send({ message: 'quantity must be a positive number' });
    }

    // Kiểm tra reserved có đủ không
    let inventory = await inventoryModel.findOne({ product: product });
    if (!inventory) {
      return res.status(404).send({ message: 'Inventory not found for this product' });
    }
    if (inventory.reserved < quantity) {
      return res.status(400).send({
        message: `Not enough reserved. Reserved: ${inventory.reserved}, requested: ${quantity}`
      });
    }

    // Giảm reserved và tăng soldCount trong 1 lần update
    let result = await inventoryModel.findOneAndUpdate(
      { product: product },
      { $inc: { reserved: -quantity, soldCount: quantity } },
      { new: true }
    ).populate({ path: 'product', select: PRODUCT_FIELDS });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

