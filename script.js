const display = document.querySelector('#display');
const expression = document.querySelector('#expression');
const buttons = document.querySelectorAll('.btns button');
const calculator = document.querySelector('.calculator');
const calculatorToggle = document.querySelector('#calculator-toggle');
const toolsToggle = document.querySelector('#tools-toggle');
const toolsMenu = document.querySelector('#tools-menu');
const toolsClose = document.querySelector('#tools-close');
const toolChoices = document.querySelectorAll('.tool-choice');
const toolList = document.querySelector('.tool-list');
const toolDetail = document.querySelector('#tool-detail');
const detailBack = document.querySelector('#detail-back');
const detailTitle = document.querySelector('#detail-title');
const detailInputLabel = document.querySelector('#detail-input-label');
const detailValue = document.querySelector('#detail-value');
const unitFromLabel = document.querySelector('#unit-from-label');
const unitFrom = document.querySelector('#unit-from');
const unitToLabel = document.querySelector('#unit-to-label');
const unitTo = document.querySelector('#unit-to');
const detailCalculate = document.querySelector('#detail-calculate');
const detailResult = document.querySelector('#detail-result');
const toolKeypad = document.querySelector('#tool-keypad');
let selectedTool = null;
const toolOperations = {
	currency: { title: 'Currency', input: 'USD amount', output: 'global rates', convert: (value) => value },
	length: { title: 'Length', input: 'Length', output: 'Centimeters', convert: (value) => value * 100 },
	area: { title: 'Area', input: 'Square units', output: 'Square units', convert: (value) => value },
	volume: { title: 'Volume', input: 'Cubic units', output: 'Cubic units', convert: (value) => value },
	weight: { title: 'Weight', input: 'Kilograms', output: 'Pounds', convert: (value) => value * 2.20462 },
	temperature: { title: 'Temperature', input: 'Celsius', output: 'Fahrenheit', convert: (value) => value * 9 / 5 + 32 },
	speed: { title: 'Speed', input: 'Kilometers per hour', output: 'Miles per hour', convert: (value) => value * .621371 },
	pressure: { title: 'Pressure', input: 'Bar', output: 'PSI', convert: (value) => value * 14.5038 },
	power: { title: 'Power', input: 'Watts', output: 'Kilowatts', convert: (value) => value / 1000 },
	number: { title: 'Number system', input: 'Decimal', output: 'Binary', convert: (value) => parseInt(value, 10).toString(2) }
};
const currencyRates = {
	USD: 1, EUR: .92, GBP: .78, INR: 83.2, JPY: 149.6, CNY: 7.24,
	CAD: 1.36, AUD: 1.52, CHF: .89, SGD: 1.34, HKD: 7.82, NZD: 1.64,
	SEK: 10.5, NOK: 10.7, DKK: 6.86, ZAR: 18.4, BRL: 5.1, MXN: 17.1,
	KRW: 1350, AED: 3.67, SAR: 3.75, TRY: 32.2, PLN: 4.0, THB: 36.2,
	IDR: 15600, MYR: 4.7, PHP: 58.3, CZK: 23.1, HUF: 360, ILS: 3.7
};
const unitDefinitions = {
	currency: { units: currencyRates, labels: ['Currency', 'Currency'] },
	length: { units: { m: 1, cm: 100, ft: 3.28084, in: 39.3701 }, labels: ['Meters', 'Centimeters'] },
	area: { units: { 'm²': 1, 'cm²': 10000, 'ft²': 10.7639, 'in²': 1550.003 }, labels: ['Square meters', 'Square feet'] },
	volume: { units: { 'm³': 1, L: 1000, 'ft³': 35.3147, gal: 264.172 }, labels: ['Cubic meters', 'Liters'] },
	weight: { units: { kg: 1, g: 1000, lb: 2.20462, oz: 35.274 }, labels: ['Kilograms', 'Pounds'] },
	temperature: { units: { C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' }, labels: ['Celsius', 'Fahrenheit'] },
	speed: { units: { 'km/h': 1, mph: .621371, 'm/s': .277778, knot: .539957 }, labels: ['Kilometers per hour', 'Miles per hour'] },
	pressure: { units: { bar: 1, psi: 14.5038, kPa: 100, atm: .986923 }, labels: ['Bar', 'PSI'] },
	power: { units: { W: 1, kW: .001, hp: .00134102 }, labels: ['Watts', 'Kilowatts'] },
	number: { units: { Decimal: 10, Binary: 2, Octal: 8, Hexadecimal: 16 }, labels: ['Decimal', 'Binary'] }
};
const operations = {
	'+': (left, right) => left + right,
	'-': (left, right) => left - right,
	'*': (left, right) => left * right,
	'/': (left, right) => right === 0 ? NaN : left / right
};
const errorValues = new Set(['Syntax Error', 'Math Error']);

let currentValue = '0';
let storedValue = null;
let pendingOperator = null;
let shouldResetDisplay = false;
let lastExpression = '';
let inputStarted = false;

function render() {
	const hasResult = isError() || lastExpression.endsWith('=');
	display.textContent = hasResult ? currentValue : (inputStarted ? '' : '0');
	if (storedValue !== null && pendingOperator) {
		const rightSide = shouldResetDisplay ? '' : ` ${formatNumber(currentValue)}`;
		expression.textContent = `${formatNumber(storedValue)} ${operatorSymbol(pendingOperator)}${rightSide}`;
	} else {
		expression.textContent = lastExpression || (inputStarted ? formatNumber(currentValue) : '');
	}
}

function formatNumber(value) {
	return Number(value).toLocaleString('en-US', { maximumFractionDigits: 10 });
}

function formatResult(value) {
	return String(Number(value.toPrecision(12)));
}

function operatorSymbol(operator) {
	return { '*': '×', '/': '÷', '-': '−', '+': '+' }[operator] || operator;
}

function isError() {
	return errorValues.has(currentValue);
}

function inputValue(value) {
	if (isError()) {
		clear();
	}
	if (shouldResetDisplay) {
		currentValue = '0';
		shouldResetDisplay = false;
		lastExpression = '';
	}
	inputStarted = true;
	if (value === '.' && currentValue.includes('.')) return;
	if (currentValue === '0' && value !== '.') currentValue = value;
	else if (currentValue.length < 14) currentValue += value;
	render();
}

function chooseOperator(operator) {
	if (isError()) return;
	if (shouldResetDisplay) lastExpression = '';
	if (pendingOperator && storedValue !== null && !shouldResetDisplay) {
		calculate(false);
		if (isError()) return;
	}
	storedValue = currentValue;
	pendingOperator = operator;
	shouldResetDisplay = true;
	render();
}

function calculate(showExpression = true) {
	if (storedValue === null || !pendingOperator) return;
	if (shouldResetDisplay) {
		setError('Syntax Error', `${formatNumber(storedValue)} ${operatorSymbol(pendingOperator)}`);
		return;
	}
	const left = Number(storedValue);
	const right = Number(currentValue);
	const operation = operations[pendingOperator];
	const result = operation?.(left, right);
	if (!operation || !Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(result)) {
		setError('Math Error', `${formatNumber(left)} ${operatorSymbol(pendingOperator)} ${formatNumber(right)}`);
		return;
	}
	lastExpression = showExpression ? `${formatNumber(left)} ${operatorSymbol(pendingOperator)} ${formatNumber(right)} =` : '';
	currentValue = formatResult(result);
	storedValue = null;
	pendingOperator = null;
	shouldResetDisplay = true;
	render();
}

function setError(message, attemptedExpression) {
	currentValue = message;
	storedValue = null;
	pendingOperator = null;
	shouldResetDisplay = true;
	lastExpression = attemptedExpression;
	inputStarted = false;
	render();
}

function clear() {
	currentValue = '0';
	storedValue = null;
	pendingOperator = null;
	shouldResetDisplay = false;
	lastExpression = '';
	inputStarted = false;
	render();
}

function backspace() {
	if (shouldResetDisplay || isError()) return clear();
	currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
	if (currentValue === '-') currentValue = '0';
	render();
}

function percent() {
	if (isError()) return;
	currentValue = String(Number(currentValue) / 100);
	render();
}

function toggleSign() {
	if (!isError() && currentValue !== '0') {
		currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : `-${currentValue}`;
		render();
	}
}

buttons.forEach((button) => {
	button.addEventListener('click', () => {
		const { action, value } = button.dataset;
		if (value) {
			if ('+-*/'.includes(value)) chooseOperator(value);
			else inputValue(value);
		} else if (action === 'clear') clear();
		else if (action === 'backspace') backspace();
		else if (action === 'percent') percent();
		else if (action === 'toggle-sign') toggleSign();
		else if (action === 'calculate') calculate();
	});
});

document.addEventListener('keydown', (event) => {
	const key = event.key;
	if (toolsMenu.classList.contains('open')) {
		if (!toolDetail.hidden && selectedTool) {
			if (key === 'Enter' || key === '=') {
				detailCalculate.click();
				event.preventDefault();
			} else if (key === 'Escape') {
				showToolList();
				event.preventDefault();
			}
		} else if (key === 'Escape') {
			setToolsOpen(false);
			event.preventDefault();
		}
		return;
	}
	if (/^[\d.]$/.test(key)) inputValue(key);
	else if ('+-*/'.includes(key)) chooseOperator(key);
	else if (key === 'Enter' || key === '=') calculate();
	else if (key === 'Escape') clear();
	else if (key === 'Backspace') backspace();
	else return;
	event.preventDefault();
});

function setToolsOpen(isOpen) {
	toolsMenu.classList.toggle('open', isOpen);
	toolsMenu.setAttribute('aria-hidden', String(!isOpen));
	toolsToggle.setAttribute('aria-expanded', String(isOpen));
}

calculatorToggle.addEventListener('click', () => {
	const isMinimized = calculator.classList.toggle('minimized');
	if (isMinimized) setToolsOpen(false);
	calculatorToggle.setAttribute('aria-label', isMinimized ? 'Restore calculator' : 'Minimize calculator');
	calculatorToggle.setAttribute('title', isMinimized ? 'Restore calculator' : 'Minimize calculator');
});

function restoreCalculator() {
	if (!calculator.classList.contains('minimized')) return;
	calculator.classList.remove('minimized');
	calculatorToggle.setAttribute('aria-label', 'Minimize calculator');
	calculatorToggle.setAttribute('title', 'Minimize calculator');
}

toolsToggle.addEventListener('click', () => {
	restoreCalculator();
	setToolsOpen(!toolsMenu.classList.contains('open'));
});
toolsClose.addEventListener('click', () => setToolsOpen(false));

toolChoices.forEach((choice) => {
	choice.addEventListener('click', () => {
		selectedTool = choice.dataset.tool;
		if (selectedTool === 'calculator') {
			setToolsOpen(false);
			return;
		}
		const tool = toolOperations[selectedTool];
		toolChoices.forEach((item) => item.classList.toggle('active', item === choice));
		toolList.hidden = true;
		toolDetail.hidden = false;
		detailTitle.textContent = tool.title;
		detailInputLabel.firstChild.textContent = `${tool.input} `;
		detailValue.type = selectedTool === 'number' ? 'text' : 'number';
		detailValue.value = '';
		detailResult.textContent = `Result in ${tool.output}`;
		const definition = unitDefinitions[selectedTool];
		unitFromLabel.hidden = false;
		unitToLabel.hidden = false;
		const units = Object.keys(definition.units).sort();
		const options = units.map((unit) => `<option value="${unit}">${unit}</option>`).join('');
		unitFrom.innerHTML = options;
		unitTo.innerHTML = options;
		unitFrom.value = selectedTool === 'currency' ? 'USD' : units[0];
		unitTo.value = selectedTool === 'currency' ? 'EUR' : units[Math.min(1, units.length - 1)];
		if (selectedTool === 'currency') detailInputLabel.firstChild.textContent = 'Amount ';
		detailResult.textContent = `Result in ${unitTo.value}`;
		detailValue.focus();
	});
});

function showToolList() {
	toolList.hidden = false;
	toolDetail.hidden = true;
	toolChoices.forEach((item) => item.classList.remove('active'));
	selectedTool = null;
}

detailBack.addEventListener('click', showToolList);
toolKeypad.addEventListener('click', (event) => {
	const key = event.target.dataset.toolKey;
	if (!key) return;
	if (key === 'clear') detailValue.value = '';
	else if (key === 'backspace') detailValue.value = detailValue.value.slice(0, -1);
	else if (key === '.' && detailValue.value.includes('.')) return;
	else detailValue.value += key;
	detailValue.focus();
});

detailCalculate.addEventListener('click', () => {
	const tool = toolOperations[selectedTool];
	const value = selectedTool === 'number' ? detailValue.value : Number(detailValue.value);
	const result = tool.convert(value);
	const isValid = selectedTool === 'number' ? /^-?\d+$/.test(String(value)) && !Number.isNaN(Number(result)) : Number.isFinite(result);
	if (Number.isFinite(value) && selectedTool === 'temperature') {
		const from = unitFrom.value;
		const to = unitTo.value;
		const celsius = from === 'C' ? value : from === 'F' ? (value - 32) * 5 / 9 : value - 273.15;
		const converted = to === 'C' ? celsius : to === 'F' ? celsius * 9 / 5 + 32 : celsius + 273.15;
		detailResult.textContent = `${value.toFixed(2)} °${from} = ${converted.toFixed(2)} °${to}`;
	} else if (Number.isFinite(value) && selectedTool === 'number') {
		const fromBase = unitDefinitions.number.units[unitFrom.value];
		const toBase = unitDefinitions.number.units[unitTo.value];
		const decimal = parseInt(String(value), fromBase);
		const converted = Number.isNaN(decimal) ? null : decimal.toString(toBase).toUpperCase();
		detailResult.textContent = converted === null ? 'Enter a valid number' : `${value} ${unitFrom.value} = ${converted} ${unitTo.value}`;
	} else if (Number.isFinite(value)) {
		const definition = unitDefinitions[selectedTool];
		const converted = value * definition.units[unitTo.value] / definition.units[unitFrom.value];
		detailResult.textContent = `${value.toFixed(2)} ${unitFrom.value} = ${converted.toFixed(2)} ${unitTo.value}`;
	} else {
		detailResult.textContent = isValid ? `${typeof result === 'number' ? result.toFixed(2) : result} ${tool.output}` : 'Enter a valid value';
	}
});

render();
