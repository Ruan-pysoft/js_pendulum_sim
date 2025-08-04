const Tau = 2 * 3.14159;

const metreFactor = 200; // pixels in a metre

const anchorX = 250;
const anchorY = 10;
var l = 1; // m
var r = 0.05; // m
var V = 2/3 * Tau * r*r*r; // m^3
// steel
var rho = 7.85; // density (g/cm^3)
var m = (rho / 1000 * 100*100*100) * V; // kg
var g = 9.81; // m/s^2
// air
//var mu = 1.8e-5; // viscosity (Pa * s)
// water
//var mu = 1e-3; // viscosity (Pa * s)
var mu = 0.1; // viscosity (Pa * s)
var theta = Tau/4 / 2; // angle from vertical (rad)
var omega = 0.1; // angular velocity (rad/s)
var t = NaN; // period (s)
var lastInflection = NaN;

function model1() {
	const predictedT = Math.sqrt(l/g) * 1000; // working in milliseconds
	const constant = t/predictedT;

	return constant;
}
function model2() {
	const v = omega * l;
	// tension = outwards pull from gravity - inwards force from simple harmonic motion
	// (assumes simple harmonic motion)
	const tension = m*g*Math.cos(theta) - m*v*v/l;
	const predictedT = (tension/v/v/mu) * 1000; // working in milliseconds
	const constant = t/predictedT;

	return constant;
}

function physics(delta, time) {
	const dt = delta / 1000;

	const prevOmega = omega;

	// viscous drag (angular damping coefficient)
	// From Stokes' law (https://en.wikipedia.org/wiki/Stokes'_law)
	const v = omega * l;
	const F_d = -3 * Tau * mu * r * v;
	// convert to torque
	const T_d = F_d * l;

	// gravity tangent to pendulum line (in the direction of the motion)
	const F_g = - m * g * Math.sin(theta);
	// convert to torque
	const T_g = F_g * l;

	// acceleration = force/mass
	// or in this case, angular acceleration = torque/mass
	const alpha = (T_g + T_d) / m;

	omega += alpha * dt;
	theta += omega * dt;

	if ((omega < 0) != (prevOmega < 0)) {
		t = time - lastInflection;
		t *= 2; // only half a period has occurred since last local maximum height
		lastInflection = time;
	}
}

function display(delta) {
	const dtDisplay = document.getElementById("dtDisplay");
	dtDisplay.innerHTML = (delta / 1000) + "s";
	const lDisplay = document.getElementById("lDisplay");
	lDisplay.innerHTML = l + "m";
	const rDisplay = document.getElementById("rDisplay");
	rDisplay.innerHTML = r + "m";
	const mDisplay = document.getElementById("mDisplay");
	mDisplay.innerHTML = m + "kg";
	const gDisplay = document.getElementById("gDisplay");
	gDisplay.innerHTML = g + "m/s²";
	const muDisplay = document.getElementById("muDisplay");
	muDisplay.innerHTML = mu + "Pa s";
	const thetaDisplay = document.getElementById("thetaDisplay");
	thetaDisplay.innerHTML = theta + " rad";
	const omegaDisplay = document.getElementById("omegaDisplay");
	omegaDisplay.innerHTML = omega + " rad/s";
	const tDisplay = document.getElementById("tDisplay");
	tDisplay.innerHTML = (t / 1000) + "s";
	const model1Display = document.getElementById("model1Display");
	model1Display.innerHTML = model1();
	const model2Display = document.getElementById("model2Display");
	model2Display.innerHTML = model2();
}

const backbuffer = document.createElement("canvas");
var displayTimer = 0;
function draw(canvas, delta, time) {
	const ctx = canvas.getContext("2d");
	const backCtx = backbuffer.getContext("2d");

	backCtx.clearRect(0, 0, canvas.width, canvas.height);
	backCtx.drawImage(canvas, 0, 0);

	if (delta == 0) return;
	if (delta > 100) {
		// don't bother with calculations for intervals >= 0.1s,
		// as it will be completely inaccurate
		return;
	}

	physics(delta, time);

	displayTimer += delta;
	if (displayTimer >= 100) {
		display(delta);
		displayTimer -= 100;
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.globalAlpha = 0.9;
	ctx.drawImage(backbuffer, 0, 0);
	ctx.globalAlpha = 1;

	const x = anchorX + l*metreFactor*Math.sin(theta);
	const y = anchorY + l*metreFactor*Math.cos(theta);

	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(anchorX, anchorY);
	ctx.lineTo(x, y);
	ctx.stroke();

	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	ctx.fillStyle = "red";
	ctx.beginPath();
	ctx.ellipse(x, y, r*metreFactor, r*metreFactor, 0, 0, Tau);
	ctx.stroke();
	ctx.fill();
}

function init() {
	const canvas = document.getElementById("draw");
	backbuffer.width = canvas.width;
	backbuffer.height = canvas.height;

	var t = Date.now();

	setInterval(function() {
		var dt = Date.now() - t;
		t += dt;
		draw(canvas, dt, t);
	}, 17); // 17ms ~ 60fps
}

init();
