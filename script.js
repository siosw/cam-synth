// TODO: get pitch and freq from synth directly
let pitchA = 440;
let pitchB = 293;
let freq = 400;

const video = document.getElementById('video');

const synthA = new Tone.Synth();
const synthB = new Tone.FMSynth();
const filter = new Tone.Filter(freq, 'lowpass');
const feedbackDelay = new Tone.FeedbackDelay(0.5, 0.5);
const distortion = new Tone.Distortion(3);

synthA.chain(feedbackDelay, distortion, filter, Tone.Destination);
synthB.chain(feedbackDelay, distortion, filter, Tone.Destination);

document.querySelector('button')?.addEventListener('click', async () => {
	await Tone.start()
  synthA.triggerAttack(pitchA); 
  synthB.triggerAttack(pitchB); 
});

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  Tone.loaded()
]).then(startVideo)

async function startVideo() {
  const constraints = {
    audio: false,
    video: true,
  };

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch(err) {
    console.log(err);
  }
}

video.addEventListener('playing', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

    for (face of detections) modifySynth(face.expressions);
  }, 100)
})

function modifySynth(expressions) {
  const strongest = strongestExpression(expressions);

  if (strongest === 'happy') {
    pitchA += 5;
    pitchB -= 1;
    synthA.setNote(pitchA);
    synthB.setNote(pitchB);
  } else if (strongest === 'sad') {
    pitchA -= 5;
    pitchB -= 1;
    synthA.setNote(pitchA);
    synthB.setNote(pitchB);
  } else if (strongest === 'angry') {
    freq += 5;
    filter.frequency.rampTo(freq, 0.1);
  } else if (strongest === 'surprised') {
    freq -= 5;
    filter.frequency.rampTo(freq, 0.1);
  }
}

function strongestExpression(expressions) {
  let max = null;
  let maxKey = null;

  for (let exp of Object.keys(expressions)) {
    if (max === null || max < expressions[exp]) {
      max = expressions[exp];
      maxKey = exp;
    }
  }

  return maxKey;
}



