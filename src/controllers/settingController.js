import * as Setting from "../models/setting.js";

const parseSettingValue = (key, value) => {
  const booleanKeys = ["auto_assign_tables", "enable_highchairs", "enable_whatsapp"];
  const integerKeys = ["max_guests_per_table", "total_estimated_guests"];

  if (booleanKeys.includes(key)) {
    return (
      value === true ||
      value === "true" ||
      value === "1" ||
      value === 1 ||
      value === "yes"
    );
  }

  if (integerKeys.includes(key)) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
};

const serializeSettingValue = (key, value) => {
  const booleanKeys = ["auto_assign_tables", "enable_highchairs", "enable_whatsapp"];

  if (booleanKeys.includes(key)) {
    return value === true ||
      value === "true" ||
      value === "1" ||
      value === 1 ||
      value === "yes"
      ? "1"
      : "0";
  }

  if (typeof value === "number" || typeof value === "string") {
    return value.toString();
  }

  return String(value);
};

export const getSettings = async (req, res) => {
  try {
    const userId = req.userContext.userId;
    const settings = await Setting.getAllSettings(userId);
    const normalizedSettings = settings.map((setting) => ({
      key: setting.key,
      value: parseSettingValue(setting.key, setting.value),
    }));

    res.json({
      success: true,
      data: normalizedSettings,
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
    const userId = req.userContext.userId;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: "Value is required",
      });
    }

    // Ownership validation - verificar que la setting existe para este usuario
    const existing = await Setting.getAllSettings(userId);
    const existingSetting = existing.find(s => s.key === key);
    if (existingSetting && existingSetting.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const serializedValue = serializeSettingValue(key, value);
    await Setting.updateSetting(key, serializedValue, userId);

    res.json({
      success: true,
      data: {
        [key]: parseSettingValue(key, value),
      },
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
