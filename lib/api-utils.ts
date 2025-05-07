/**
 * Utility functions for API interactions
 */

// Save a preset to the server
export async function savePreset(presetData: any) {
  try {
    const response = await fetch("/api/presets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(presetData),
    })

    if (!response.ok) {
      throw new Error("Failed to save preset")
    }

    return await response.json()
  } catch (error) {
    console.error("Error saving preset:", error)
    throw error
  }
}

// Get all presets from the server
export async function getPresets() {
  try {
    const response = await fetch("/api/presets")

    if (!response.ok) {
      throw new Error("Failed to fetch presets")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching presets:", error)
    throw error
  }
}
