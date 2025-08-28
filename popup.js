document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const totalIncidentsEl = document.getElementById("totalIncidents")
  const todayIncidentsEl = document.getElementById("todayIncidents")
  const criticalIncidentsEl = document.getElementById("criticalIncidents")
  const highIncidentsEl = document.getElementById("highIncidents")
  const incidentsListEl = document.getElementById("incidentsList")
  const toggleBtn = document.getElementById("toggleAnalysis")
  const manualAnalysisBtn = document.getElementById("manualAnalysis")
  const filterBtns = document.querySelectorAll(".filter-btn")
  const adminPageBtn = document.getElementById("adminPage")
  const bridgePageBtn = document.getElementById("bridgePage") // Adding bridge page access button

  let analysisEnabled = true
  let currentFilter = "all"

  // Declare chrome variable
  const chrome = window.chrome

  // Declare emailjs variable
  const emailjs = window.emailjs

  function isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id)
    } catch (error) {
      return false
    }
  }

  if (adminPageBtn) {
    adminPageBtn.addEventListener("click", () => {
      safeChromeCall(() => {
        chrome.runtime.openOptionsPage()
      })
    })
  }

  if (bridgePageBtn) {
    bridgePageBtn.addEventListener("click", () => {
      safeChromeCall(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL("bridge.html") })
      })
    })
  }

  const configureAdminBtn = document.getElementById("configureAdmin")
  const adminUrlInput = document.getElementById("adminUrl")
  const saveAdminUrlBtn = document.getElementById("saveAdminUrl")
  const adminUrlStatus = document.getElementById("adminUrlStatus")

  // Load saved admin URL
  safeChromeCall(() => {
    chrome.storage.local.get(["adminWebsiteUrl"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Error loading admin URL:", chrome.runtime.lastError)
        return
      }
      if (result.adminWebsiteUrl && adminUrlInput) {
        adminUrlInput.value = result.adminWebsiteUrl
        if (adminUrlStatus) {
          adminUrlStatus.textContent = "✅ Admin website configured"
          adminUrlStatus.style.color = "green"
        }
      }
    })
  })

  // Save admin URL
  if (saveAdminUrlBtn) {
    saveAdminUrlBtn.addEventListener("click", () => {
      const url = adminUrlInput?.value?.trim()
      if (!url) {
        if (adminUrlStatus) {
          adminUrlStatus.textContent = "❌ Please enter a valid URL"
          adminUrlStatus.style.color = "red"
        }
        return
      }

      // Validate URL format
      try {
        new URL(url)
      } catch (e) {
        if (adminUrlStatus) {
          adminUrlStatus.textContent = "❌ Invalid URL format"
          adminUrlStatus.style.color = "red"
        }
        return
      }

      safeChromeCall(() => {
        chrome.storage.local.set({ adminWebsiteUrl: url }, () => {
          if (chrome.runtime.lastError) {
            console.log("Error saving admin URL:", chrome.runtime.lastError)
            if (adminUrlStatus) {
              adminUrlStatus.textContent = "❌ Error saving URL"
              adminUrlStatus.style.color = "red"
            }
          } else {
            if (adminUrlStatus) {
              adminUrlStatus.textContent = "✅ Admin website configured successfully!"
              adminUrlStatus.style.color = "green"
            }
            console.log("Admin website URL saved:", url)
          }
        })
      })
    })
  }

  // Toggle admin config section
  if (configureAdminBtn) {
    configureAdminBtn.addEventListener("click", () => {
      const section = document.getElementById("adminConfigSection")
      if (section) {
        section.style.display = section.style.display === "none" ? "block" : "none"
      }
    })
  }

  document.getElementById("toggleReport").addEventListener("click", () => {
    const section = document.getElementById("reportSection")
    section.style.display = section.style.display === "none" ? "block" : "none"
  })

  // Show email template after selecting office
  document.getElementById("officeSelect").addEventListener("change", (e) => {
    const selectedOffice = e.target.value
    const emailTemplate = document.getElementById("emailTemplate")

    if (selectedOffice) {
      emailTemplate.style.display = "block"
      document.getElementById("emailBody").value = `
Dear ${selectedOffice} Team,

Please find attached the incident report generated from the extension.

Best Regards,
[Your Extension]
      `
    } else {
      emailTemplate.style.display = "none"
    }
  })

  // Handle file upload (screenshot)
  document.getElementById("screenshotUpload").addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log("Selected screenshot:", file.name)
      // You can upload this to Firebase Storage if needed
    }
  })

  // Send email (just a placeholder for now)
  document.getElementById("sendEmail").addEventListener("click", () => {
    const office = document.getElementById("officeSelect").value
    const body = document.getElementById("emailBody").value

    if (!office) {
      alert("Please select an office!")
      return
    }

    console.log("Sending email to:", office)
    console.log("Body:", body)
    alert("Email sent successfully (simulation).")
  })

  // in popup.js
  function sendEmail(reportData, screenshotFile) {
    if (emailjs) {
      emailjs
        .send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
          to_email: "sylviatom004@gmail.com",
          report: JSON.stringify(reportData),
        })
        .then((res) => {
          console.log("Email sent!", res.status, res.text)
        })
        .catch((err) => {
          console.error("Email failed", err)
        })
    } else {
      console.error("emailjs is not defined")
    }
  }

  function safeChromeCall(callback, fallback = () => {}) {
    if (!isExtensionContextValid()) {
      console.log("Extension context invalidated, skipping Chrome API call")
      fallback()
      return false
    }

    try {
      callback()
      return true
    } catch (error) {
      if (error.message && error.message.includes("Extension context invalidated")) {
        console.log("Extension context invalidated during API call")
        fallback()
        return false
      }
      throw error
    }
  }

  // Manual analysis button event listener
  manualAnalysisBtn.addEventListener("click", () => {
    safeChromeCall(
      () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.log("Error querying tabs:", chrome.runtime.lastError)
            return
          }

          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "triggerAnalysis" }, (response) => {
              if (chrome.runtime.lastError) {
                console.log("Error sending message:", chrome.runtime.lastError)
              }
            })
            manualAnalysisBtn.textContent = "Analyzing..."
            setTimeout(() => {
              manualAnalysisBtn.textContent = "Analyze Current Page"
            }, 3000)
          }
        })
      },
      () => {
        console.log("Cannot trigger analysis - extension context invalid")
      },
    )
  })

  // Toggle analysis button event listener
  toggleBtn.addEventListener("click", () => {
    analysisEnabled = !analysisEnabled
    toggleBtn.textContent = `Analysis: ${analysisEnabled ? "ON" : "OFF"}`
    toggleBtn.classList.toggle("active", analysisEnabled)

    safeChromeCall(() => {
      chrome.storage.local.set({ analysisEnabled: analysisEnabled }, () => {
        if (chrome.runtime.lastError) {
          console.log("Error saving analysis state:", chrome.runtime.lastError)
        }
      })
    })
  })

  // Filter button event listeners
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      currentFilter = btn.dataset.severity

      safeChromeCall(() => {
        chrome.storage.local.set({ currentFilter: currentFilter }, () => {
          if (chrome.runtime.lastError) {
            console.log("Error saving filter state:", chrome.runtime.lastError)
          }
        })
      })
      loadIncidents()
    })
  })

  // Load analysis state from storage
  safeChromeCall(() => {
    chrome.storage.local.get(["analysisEnabled"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Error loading analysis state:", chrome.runtime.lastError)
        return
      }

      analysisEnabled = result.analysisEnabled !== false
      toggleBtn.textContent = `Analysis: ${analysisEnabled ? "ON" : "OFF"}`
      toggleBtn.classList.toggle("active", analysisEnabled)
    })
  })

  // Load current filter state from storage
  safeChromeCall(() => {
    chrome.storage.local.get(["currentFilter"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Error loading filter state:", chrome.runtime.lastError)
        return
      }

      currentFilter = result.currentFilter || "all"
      filterBtns.forEach((btn) => {
        btn.classList.remove("active")
        if (btn.dataset.severity === currentFilter) {
          btn.classList.add("active")
        }
      })
    })
  })

  // Function to calculate stats from incidents
  function calculateStats(incidents) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = {
      total: incidents.length,
      today: 0,
      critical: 0,
      high: 0,
    }

    incidents.forEach((incident) => {
      const incidentDate = new Date(incident.timestamp)
      incidentDate.setHours(0, 0, 0, 0)

      if (incidentDate.getTime() === today.getTime()) {
        stats.today++
      }

      if (incident.severity === "critical") {
        stats.critical++
      } else if (incident.severity === "high") {
        stats.high++
      }
    })

    return stats
  }

  // Function to filter incidents based on current filter
  function filterIncidents(incidents) {
    if (currentFilter === "all") {
      return incidents
    }
    return incidents.filter((incident) => incident.severity === currentFilter)
  }

  // Main function to load and display incidents
  function loadIncidents() {
    safeChromeCall(
      () => {
        chrome.storage.local.get(["incidents"], (result) => {
          if (chrome.runtime.lastError) {
            console.log("Error loading incidents:", chrome.runtime.lastError)
            return
          }

          const allIncidents = result.incidents || []
          const filteredIncidents = filterIncidents(allIncidents)
          const stats = calculateStats(allIncidents)

          // Update stats display
          if (totalIncidentsEl) totalIncidentsEl.textContent = stats.total
          if (todayIncidentsEl) todayIncidentsEl.textContent = stats.today
          if (criticalIncidentsEl) criticalIncidentsEl.textContent = stats.critical
          if (highIncidentsEl) highIncidentsEl.textContent = stats.high

          // Update incidents list
          if (!incidentsListEl) return

          if (filteredIncidents.length === 0) {
            const message =
              currentFilter === "all"
                ? "No incidents detected yet. Browse social media to start analyzing posts."
                : `No ${currentFilter} severity incidents found.`
            incidentsListEl.innerHTML = `<div class="no-incidents">${message}</div>`
            return
          }

          // Sort incidents by timestamp (newest first)
          const sortedIncidents = filteredIncidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

          incidentsListEl.innerHTML = sortedIncidents
            .map(
              (incident) => `
          <div class="incident-item">
            <div class="incident-type">${incident.type || "Unknown"}
              <span class="severity-badge severity-${incident.severity || "low"}">${(incident.severity || "low").toUpperCase()}</span>
            </div>
            <div class="incident-location">📍 ${incident.location || "Unknown location"}</div>
            <div class="incident-time">🕒 ${new Date(incident.timestamp).toLocaleString()}</div>
            ${incident.text ? `<div class="incident-text" style="margin-top: 5px; font-size: 11px; opacity: 0.9;">${incident.text.substring(0, 100)}${incident.text.length > 100 ? "..." : ""}</div>` : ""}
          </div>
        `,
            )
            .join("")
        })
      },
      () => {
        // Fallback when Chrome APIs are unavailable
        if (incidentsListEl) {
          incidentsListEl.innerHTML =
            '<div class="no-incidents">Extension context invalid - please reload the extension</div>'
        }
      },
    )
  }

  // Listen for storage changes to update UI in real-time
  if (isExtensionContextValid()) {
    try {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!isExtensionContextValid()) {
          console.log("Extension context invalidated, ignoring storage change")
          return
        }

        if (namespace === "local" && changes.incidents) {
          loadIncidents()
        }
      })
    } catch (error) {
      console.log("Error setting up storage listener:", error)
    }
  }

  // Initial load
  loadIncidents()
})

// Function to send incident to admin (moved outside DOMContentLoaded)
async function sendToAdmin(incident) {
  try {
    // This would typically send to your backend/Firebase
    console.log("✅ Incident would be sent to admin:", incident)

    if (typeof window.chrome !== "undefined" && window.chrome.storage) {
      try {
        if (!window.chrome.runtime.id) {
          console.log("Extension context invalidated, cannot save admin incident")
          return false
        }

        window.chrome.storage.local.get(["adminIncidents"], (result) => {
          if (window.chrome.runtime.lastError) {
            console.log("Error getting admin incidents:", window.chrome.runtime.lastError)
            return
          }

          const adminIncidents = result.adminIncidents || []
          adminIncidents.push({
            ...incident,
            sentToAdmin: true,
            adminTimestamp: Date.now(),
          })

          window.chrome.storage.local.set({ adminIncidents }, () => {
            if (window.chrome.runtime.lastError) {
              console.log("Error saving admin incidents:", window.chrome.runtime.lastError)
            }
          })
        })
      } catch (error) {
        console.log("Error in admin incident handling:", error)
        return false
      }
    }

    return true
  } catch (err) {
    console.error("❌ Error sending incident to admin:", err)
    return false
  }
}
