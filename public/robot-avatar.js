/* OCEAN EYE — Robot Avatar
   Adds a clickable 🤖 robot to the Alert section (Food Safety panel).
   Click -> speaks the 3 food-safety sentences once. Pulses while speaking.
   Nothing else touched. START/STOP buttons remain as-is.
*/
(function(){
  'use strict';

  var ROBOT_ID = 'oeRobotAvatar';
  var TEXT = 'IMMEDIATE CLOSURE of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';
  var speaking = false;

  function speakOnce(){
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(TEXT);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;

      var robot = document.getElementById(ROBOT_ID);
      speaking = true;
      if (robot){
        robot.style.transform = 'scale(1.15)';
        robot.style.filter = 'drop-shadow(0 0 14px #22d37f)';
      }

      u.onend = function(){
        speaking = false;
        if (robot){
          robot.style.transform = 'scale(1)';
          robot.style.filter = 'drop-shadow(0 0 8px #22d37f)';
        }
      };

      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  function findFoodSafetyPanel(){
    // Look for the panel that contains "RECOMMENDED ACTION" text
    var all = document.querySelectorAll('div, section, article');
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '');
      if (t.indexOf('RECOMMENDED ACTION') >= 0 && t.indexOf('FISH PAH LEVEL') >= 0){
        return all[i];
      }
    }
    // fallback — the panel with just RECOMMENDED ACTION
    for (var j=0;j<all.length;j++){
      var t2 = (all[j].textContent || '');
      if (t2.indexOf('RECOMMENDED ACTION') >= 0) return all[j];
    }
    return null;
  }

  function makeRobot(){
    var robot = document.createElement('div');
    robot.id = ROBOT_ID;
    robot.title = 'Click to hear the advisory';
    robot.style.cssText = [
      'display:inline-flex','align-items:center','justify-content:center',
      'width:52px','height:52px','border-radius:50%',
      'background:radial-gradient(circle at 30% 30%, #0a2a1a, #050a12)',
      'border:2px solid #22d37f',
      'font-size:28px','cursor:pointer',
      'box-shadow:0 0 8px #22d37f',
      'transition:transform 0.2s ease, filter 0.2s ease',
      'user-select:none','margin-right:12px','vertical-align:middle'
    ].join(';');
    robot.textContent = '🤖';
    robot.onclick = function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      speakOnce();
    };
    return robot;
  }

  function mount(){
    if (document.getElementById(ROBOT_ID)) return;

    var panel = findFoodSafetyPanel();
    if (!panel) return;

    // find "RECOMMENDED ACTION" label inside the panel
    var nodes = panel.querySelectorAll('div, span, p');
    var label = null;
    for (var i=0;i<nodes.length;i++){
      var t = (nodes[i].textContent || '').trim().toUpperCase();
      if (t === 'RECOMMENDED ACTION'){ label = nodes[i]; break; }
    }

    var robot = makeRobot();

    if (label && label.parentNode){
      // insert robot just above the RECOMMENDED ACTION label, inside a flex row with it
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;margin:8px 0;';
      label.parentNode.insertBefore(row, label);
      row.appendChild(robot);
      row.appendChild(label);
    } else {
      // fallback — prepend to panel
      panel.insertBefore(robot, panel.firstChild);
    }

    console.log('[robot-avatar] mounted');
  }

  function boot(){
    mount();
    setInterval(mount, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('[robot-avatar] armed');
})();
