// Function to get the current time rounded down by 15 minutes in ET
function getCurrentTimeRoundedET() {
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const roundedTime = new Date(currentTime);
    roundedTime.setMilliseconds(0);
    roundedTime.setSeconds(0);
    const minutes = roundedTime.getMinutes();
    roundedTime.setMinutes(minutes - (minutes % 15)); // Round down by subtracting the remainder
    return roundedTime;
}

function updateTime() {
    const estTime = getCurrentTimeRoundedET();
    const options = { timeZone: 'America/New_York', timeStyle: 'medium' };
    const formattedTime = estTime.toLocaleTimeString('en-US', options);
    document.getElementById('time').innerText = formattedTime;
}

// Update the time every second
setInterval(updateTime, 1000);

// Function to convert time string to Date object
function parseTimeToUTCDate(txStart) {
    const [hours, minutes, seconds] = txStart.split(":");
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
    return date;
}

// Function to find the nearest time slot
function findNearestTimeSlot(scheduleData) {
    const currentTime = getCurrentTimeRoundedET();
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

// Function to convert time string to shorter format (e.g., 18:00:00 -> 6:00p)
function convertToShorterTimeFormat(timeString) {
    const [hours, minutes] = timeString.split(":");
    let hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'p' : 'a';
    hour = hour % 12 || 12; // Convert to 12-hour format, 0 should be converted to 12
    return `${hour}:${minutes}${amPm}`;
}

// Function to display the four following slots
function displayFollowingSlots(scheduleData, nearestSlot, showsData) {
    const showBlocks = document.querySelectorAll('.show-slot');

    let startIndex = scheduleData.indexOf(nearestSlot);
    let endIndex = startIndex + 4; // Display only the next four slots

    for (let i = startIndex; i < endIndex; i++) {
        const slot = scheduleData[i];
        const showBlock = showBlocks[i - startIndex];

        // Retrieve the full show title from the showsData using the showId from the scheduleData
        const fullTitle = showsData[slot.showId]?.name || 'Show Title';

        showBlock.querySelector('.show-name').textContent = fullTitle;
        showBlock.querySelector('.airing-time').textContent = convertToShorterTimeFormat(slot.tx_start);
        setBackgroundForShowBlock(showBlock, slot.showId); // Set background image
    }
}

// Function to set the background image for each show block
function setBackgroundForShowBlock(showBlock, showId) {
    const imagePath = `donebetter.live/images/${showId}.png?${Date.now()}`; // Add random query parameter
    const placeholderImg = 'placeholder.png'

    // Check if the image exists
    const img = new Image();
    img.src = imagePath;
    img.onload = () => {
        // Image exists, set it as the background with background-size: cover and background-position: center
        showBlock.style.backgroundImage = `url(${imagePath})`;
        showBlock.style.backgroundSize = 'cover';
        showBlock.style.backgroundPosition = 'center';
    };
    img.onerror = () => {
        // Image does not exist, set placeholder as the background with background-size: cover and background-position: center
        showBlock.style.backgroundImage = `url(${placeholderImg})`;
        showBlock.style.backgroundSize = 'cover';
        showBlock.style.backgroundPosition = 'center';
    };
}

// Function to update the schedule data based on the current day and time in ET
async function updateScheduleData() {
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayOfWeek[new Date(currentTime).getDay()];
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


// Function to update the schedule data and display the table
async function displaySchedule() {
    await updateScheduleData();
}

// Call the function to populate the table
displaySchedule();

// Set up a daily interval to update the schedule data at around 6 am in ET
const updateInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
setInterval(() => {
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    if (new Date(currentTime).getHours() === 6 && new Date(currentTime).getMinutes() < 15) {
        displaySchedule();
    }
}, updateInterval);
