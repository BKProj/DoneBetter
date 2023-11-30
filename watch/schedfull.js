// Function to get the current time rounded down by 15 minutes
function getCurrentTimeRounded() {
  const currentTime = new Date();
  const gmtPlusTwoOffset = 2 * 60 * 60 * 1000; // GMT+2 offset in milliseconds
  currentTime.setTime(currentTime.getTime() + gmtPlusTwoOffset);
  currentTime.setMilliseconds(0);
  currentTime.setSeconds(0);
  const minutes = currentTime.getMinutes();
  currentTime.setMinutes(minutes - (minutes % 15)); // Round down by subtracting the remainder
  return currentTime;
}

        // Function to find the nearest time slot
        function findNearestTimeSlot(scheduleData) {
          const currentTime = getCurrentTimeRounded();
          const currentTimeUTC = Date.UTC(1970, 0, 1, currentTime.getUTCHours(), currentTime.getUTCMinutes(), currentTime.getUTCSeconds());
          let nearestSlot = scheduleData[0];
          let nearestTimeDiff = Infinity;
          for (const slot of scheduleData) {
              const slotTimeUTC = parseTimeToUTCDate(slot.tx_start).getTime();
              const timeDiff = slotTimeUTC - currentTimeUTC;
              if (timeDiff >= 0 && timeDiff < nearestTimeDiff) {
                  nearestSlot = slot;
                  nearestTimeDiff = timeDiff;
              }
          }
          return nearestSlot;
      }

// Function to convert time string to Date object
function parseTimeToUTCDate(txStart) {
  const [hours, minutes, seconds] = txStart.split(":");
  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
  return date;
}

// Function to convert time string to shorter format (e.g., 18:00:00 -> 6:00p)
function convertToShorterTimeFormat(timeString) {
  const [hours, minutes] = timeString.split(":");
  let hour = parseInt(hours, 10);
  const amPm = hour >= 12 ? 'p' : 'a';
  hour = hour % 12 || 12; // Convert to 12-hour format, 0 should be converted to 12
  return `${hour}:${minutes}${amPm}`;
}

// Function to display the four following slots in a table
function displayFollowingSlots(scheduleData, nearestSlot, showsData) {
  const tableBody = document.getElementById('schedule-table-body');
  let tableRows = '';

  for (const slot of scheduleData) {
      const fullTitle = showsData[slot.showId]?.name || 'Show Title';
      const time = convertToShorterTimeFormat(slot.tx_start);
      const imagePath = `/images/${slot.showId}.png?${Date.now()}`; // Add random query parameter
      const placeholderImg = 'placeholder.png';

      // Add a CSS class 'highlighted' to the row for the nearest slot
      const rowClass = slot === nearestSlot ? 'highlighted' : '';


      const row = `
          <tr>
              <td>${time}</td>
              <td>${fullTitle}</td>
          </tr>
      `;
      tableRows += row;
  }
  tableBody.innerHTML = tableRows;
}

// Function to update the schedule data based on the current day and time
async function updateScheduleData() {
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = dayOfWeek[new Date().getDay()];
  const scheduleFileName = `/schedules/sched_${currentDay}.json`;

  try {
      const response1 = await fetch(scheduleFileName);
      const jsonData1 = await response1.json();

      const response2 = await fetch('/shows.json');
      const jsonData2 = await response2.json();

      const scheduleData = jsonData1.schedule.all;
      const nearestSlot = findNearestTimeSlot(scheduleData);
      displayFollowingSlots(scheduleData, nearestSlot, jsonData2);
  } catch (error) {
      console.error('Error fetching JSON data:', error);
      // Handle the error, show an appropriate message, etc.
  }
}

async function displaySchedule(selectedDay) {
  const scheduleFileName = `/schedules/sched_${selectedDay}.json`;
  try {
    const response1 = await fetch(scheduleFileName);
    const jsonData1 = await response1.json();

    const response2 = await fetch('/shows.json');
    const jsonData2 = await response2.json();

    const scheduleData = jsonData1.schedule.all;
    const nearestSlot = findNearestTimeSlot(scheduleData);
    displayFollowingSlots(scheduleData, nearestSlot, jsonData2);
  } catch (error) {
    console.error('Error fetching JSON data:', error);
    // Handle the error, show an appropriate message, etc.
  }
}


// Call the function to populate the table with today's schedule initially
const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
displaySchedule(currentDay || 'thu'); // Use 'mon' as the default day if currentDay is undefined

// Set up a daily interval to update the schedule data at around 6 am
const updateInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
setInterval(() => {
  const currentTime = new Date();
  if (currentTime.getHours() === 6 && currentTime.getMinutes() < 15) {
    const selectedDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][currentTime.getDay()];
    displaySchedule(selectedDay);
  }
}, updateInterval);



function onDaySwitch(selectedDay) {
  displaySchedule(selectedDay);

  const buttons = document.querySelectorAll('.day-switcher-button');
  buttons.forEach(button => button.classList.remove('active'));

  const activeButton = document.getElementById(`btn${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`);
  activeButton.classList.add('active');
}
