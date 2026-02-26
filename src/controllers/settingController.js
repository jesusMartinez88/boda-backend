import * as Setting from "../models/setting.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.getAllSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching settings",
      message: error.message,
    });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: "Value is required",
      });
    }

    const result = await Setting.updateSetting(key, value.toString());
    res.json({
      success: true,
      data: result,
      message: `Setting ${key} updated successfully`,
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({
      success: false,
      error: "Error updating setting",
      message: error.message,
    });
  }
};
