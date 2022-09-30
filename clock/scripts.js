


var last_secs = 100;

function update_page() {
  const now        = new Date();

  const seconds = now.getSeconds();
  document.getElementById("seconds").innerText = human_number(seconds);

  if (last_secs < seconds) {
    last_secs = seconds;
    return;
  }

  last_secs = seconds;

  const hour       = now.getHours();
  const human_hour = hour % 12;
  document.getElementById("hour").innerText = human_number(human_hour);

  const minute       = now.getMinutes();
  document.getElementById("minute").innerText = human_number(minute);

  document.getElementById("day").innerText = human_number(now.getDate());
  document.getElementById("month").innerText = human_number(now.getMonth() + 1);
  document.getElementById("year").innerText = human_number(now.getYear() - 100);
  
  const daynum = now.getDay();
  switch (daynum) {
    case 0:
      document.getElementById("dayname").innerText = 'Sun';
      break;
    case 1:
      document.getElementById("dayname").innerText = 'Mon';
      break;
    case 2:
      document.getElementById("dayname").innerText = 'Tue';
      break;
    case 3:
      document.getElementById("dayname").innerText = 'Wed';
      break;
    case 4:
      document.getElementById("dayname").innerText = 'Thu';
      break;
    case 5:
      document.getElementById("dayname").innerText = 'Fri';
      break;
    case 6:
      document.getElementById("dayname").innerText = 'Sat';
      break;
  }
} // end function

console.log("loaded");
// update_page();

const x_interval = setInterval(update_page, 1000);


function human_number(x) {
  if (x < 10)
    return '0' + x.toString();
  return x.toString();
}


function show_fullscreen() {
  let elem = document.documentElement;

  elem.requestFullscreen({ navigationUI: "show" }).catch((err) => {
    alert(`An error occurred while trying to switch into fullscreen mode: ${err.message} (${err.name})`);
  });
}

var wakeLock = null;

async function fullscreen_change (ev) {
  if (document.fullscreenElement) {
    document.body.classList.add("fullscreen");
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        document.body.classList.add('wakelock_active');
      } catch (err) {
        document.body.classList.remove('wakelock_active');
      }
    }
    return;
  }

  document.body.classList.remove("fullscreen");
  if (wakeLock) {
    wakeLock.release().then(() => {
      document.body.classList.remove('wakelock_active');
      wakeLock = null;
    });
  }
} // function fullscreen_change

document.addEventListener('fullscreenchange', fullscreen_change);


if ('wakeLock' in navigator) {
  document.body.classList.add("wakelock");
}
