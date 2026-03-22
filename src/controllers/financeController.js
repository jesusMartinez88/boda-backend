import * as Finance from "../models/finance.js";

export const getFinances = async (req, res) => {
  const finances = await Finance.getAllFinances();
  res.json({
    success: true,
    data: finances,
    count: finances.length,
  });
};

export const getFinance = async (req, res) => {
  const { id } = req.params;
  const finance = await Finance.getFinanceById(id);
  if (!finance) {
    return res.status(404).json({
      success: false,
      error: "Finance record not found",
    });
  }
  res.json({
    success: true,
    data: finance,
  });
};

export const createFinance = async (req, res) => {
  const { description, amount, type, category, date, paidBy } = req.body;
  if (!description || amount === undefined || !type) {
    return res.status(400).json({
      success: false,
      error: "Description, amount and type are required",
    });
  }
  const newFinance = await Finance.createFinance({ description, amount, type, category, date, paidBy });
  res.status(201).json({
    success: true,
    data: newFinance,
    message: "Finance record created successfully",
  });
};

export const updateFinance = async (req, res) => {
  const { id } = req.params;
  const { description, amount, type, category, date, paidBy } = req.body;
  
  const existing = await Finance.getFinanceById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: "Finance record not found",
    });
  }

  const updated = await Finance.updateFinance(id, {
    description,
    amount,
    type,
    category,
    date: date || existing.date,
    paidBy,
  });

  res.json({
    success: true,
    data: updated,
    message: "Finance record updated successfully",
  });
};

export const deleteFinance = async (req, res) => {
  const { id } = req.params;
  const existing = await Finance.getFinanceById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: "Finance record not found",
    });
  }
  await Finance.deleteFinance(id);
  res.json({
    success: true,
    message: "Finance record deleted successfully",
  });
};
