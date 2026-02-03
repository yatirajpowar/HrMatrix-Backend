import db from "../config/db.js";

// GET ALL EVENTS FOR HR'S BUSINESS UNIT
export const getAllEvents = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const [events] = await db.query(
      `SELECT 
        e.event_id,
        e.title,
        e.description,
        e.event_date,
        e.location,
        u.name as created_by,
        e.created_at
      FROM events e
      JOIN users u ON e.created_by = u.user_id
      WHERE e.company_id = ?
      ORDER BY e.event_date DESC`,
      [company_id]
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching events",
    });
  }
};

// CREATE EVENT
export const createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location } = req.body;
    const user_id = req.user?.user_id;
    const company_id = req.user?.company_id;

    if (!title || !event_date) {
      return res.status(400).json({
        success: false,
        message: "Title and event_date are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO events (title, description, event_date, location, created_by, company_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || null, event_date, location || null, user_id, company_id]
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: {
        event_id: result.insertId,
        title,
        description,
        event_date,
        location,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Error creating event",
    });
  }
};

// DELETE EVENT
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const [event] = await db.query(
      "SELECT event_id FROM events WHERE event_id = ? AND company_id = ?",
      [id, company_id]
    );

    if (event.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Event not found",
      });
    }

    await db.query("DELETE FROM events WHERE event_id = ?", [id]);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting event",
    });
  }
};
