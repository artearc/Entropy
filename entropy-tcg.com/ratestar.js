function sendFeedback() {
	const nav = document.querySelector("input[name=rating__nav]:checked");
	const info = document.querySelector("input[name=rating__info]:checked");
	const experience = document.querySelector("input[name=rating__experience]:checked");

	const feedback = {
		nav: checkValues(nav),
		info: checkValues(info),
		experience: checkValues(experience)
	};

	displayFeedback(JSON.stringify(feedback));
}

function checkValues(el) {
	if (!el) {
		return null;
	} else {
		return el.value;
	}
}

function displayFeedback(msg) {
	const feedbackEl = document.createElement("pre");
	feedbackEl.insertAdjacentHTML("afterbegin", msg);
	document.querySelector(".feedback").append(feedbackEl);
}

document.querySelector(".feedback__submit").addEventListener("click", (e) => {
	e.preventDefault();
	sendFeedback();
});
