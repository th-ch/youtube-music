module.exports = () => {
    setupPlaybarOnwheel();
    setupObserver();
    firstTooltip();
}

function firstTooltip () {  
    const videoStream = document.querySelector(".video-stream");
    if (videoStream) {
        setTooltip(Math.round(parseFloat(videoStream.volume) * 100));
    } else {
      setTimeout(firstTooltip, 500); // try again in 500 milliseconds
    }
  }

function setupPlaybarOnwheel() {
    //add onwheel event to play bar
    document.querySelector("ytmusic-player-bar").onwheel = (event) => {
        event.preventDefault();
        //event.deltaY < 0 => wheel up
        changeVolume(event.deltaY < 0)
    }
}

let newVolume;


function changeVolume(increase) {
    //need to change both the slider and the actual volume
    const videoStream = document.querySelector(".video-stream");
    const slider = document.querySelector("#volume-slider");
    //get the volume diff to apply
    const diff = increase
        ? videoStream.volume < 1 ? 0.01 : 0
        : videoStream.volume > 0 ? -0.01 : 0
    //apply on both elements and save the new volume
    videoStream.volume += diff;
    newVolume = Math.round(parseFloat(videoStream.volume) * 100);
    slider.value = newVolume;
    //finally change tooltip to new value
    setTooltip(newVolume)
}

//observer sets the tooltip when volume is manually changed
function setupObserver() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            //this checks that the new volume was manually set (without the new changeVolume() function)
            if (mutation.oldValue !== mutation.target.value
                && (!newVolume || Math.abs(newVolume - mutation.target.value) > 4)) {
                //if diff>4 -> it was manually set, so update tooltip accordingly
                setTooltip(mutation.target.value);
            }
        }
    });

    //observing only changes in value of volume-slider
    observer.observe(document.querySelector("#volume-slider"), {
        attributeFilter: ["value"],
        attributeOldValue: true,
    });
}

function setTooltip(newValue) {
    newValue += "%";
    //set new volume as tooltip for volume slider and icon
    document.querySelector("#volume-slider").title = newValue;
    document.querySelector("tp-yt-paper-icon-button.volume.style-scope.ytmusic-player-bar").title = newValue;

    //also for expanding slider (appears when window size is small)
    let expandingSlider = document.querySelector("#expanding-menu");
    expandingSlider.querySelector("#expand-volume-slider").title = newValue;
    expandingSlider.querySelector("#expand-volume").title = newValue;
}