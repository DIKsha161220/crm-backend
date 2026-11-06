const pool = require("../config/db");

exports.getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.customers ORDER BY customer_id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get customers:", error.message);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { full_name, phone, email } = req.body;

    if (!full_name || !phone || !email) {
      return res.status(400).json({
        message: "full_name, phone and email are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO public.customers (full_name, phone, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [full_name, phone, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create customer:", error.message);
    res.status(500).json({ message: "Failed to create customer" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, email } = req.body;

    const result = await pool.query(
      `UPDATE public.customers
       SET full_name = $1, phone = $2, email = $3
       WHERE customer_id = $4
       RETURNING *`,
      [full_name, phone, email, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update customer:", error.message);
    res.status(500).json({ message: "Failed to update customer" });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM public.customers WHERE customer_id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete customer:", error.message);
    res.status(500).json({ message: "Failed to delete customer" });
  }
};

