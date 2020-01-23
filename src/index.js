
const defaultParseOptions = {
	delimiter: ",",
	newline: "", // auto-detect
	quoteChar: '"',
	escapeChar: '"', // TODO: Is this standard? Does XLS use this?
	header: true,
	transformHeader: undefined,
	// dynamicTyping: config.dynamicTyping,
	preview: 0,
	encoding: "",
	worker: false,
	comments: false,
	step: undefined,
	complete: undefined,
	error: undefined,
	download: false,
	downloadRequestHeaders: undefined,
	// skipEmptyLines: config.skipEmptyLines,
	chunk: undefined,
	fastMode: undefined,
	beforeFirstChunk: undefined,
	withCredentials: undefined,
	transform: undefined,
	delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
};

// TODO: Do validation on steps with preview, then get confirmation and save

class Uvs {
	constructor(config = {}) {
		// DOM
		this.doc = config.document;
		this.fileSelectorId = config.fileSelectorId;
		this.fileDropId = config.fileDropId;
		this.fileSelectionContainerId = config.fileSelectionContainerId;
		this.fileSelectionResetSelector = config.fileSelectionResetSelector;
		this.workingClass = config.workingClass || 'working';
		// Options
		this.validateExtension = String(config.validateExtension);
		this.strictHeaderOrder = Boolean(config.strictHeaderOrder);
		// Comparison data
		this.headerOrder = config.headerOrder || [];
		this.columns = config.columns || {};
		// Error handling
		this.warn = config.warn || console.warn;
		// Papa config
		this.dynamicTyping = config.dynamicTyping;
		this.skipEmptyLines = config.skipEmptyLines;
		// Callbacks
		this.step = (typeof config.step === 'function') ? config.step : this.handleStep;
		this.save = (typeof config.save === 'function') ? config.save : this.handleSave;
		this.error = (typeof config.error === 'function') ? config.error : this.handleError;
	}

	//----- Default Handlers

	handleMultipleFiles() {
		alert('Can only handle one file at a time.');
		return false;
	}

	handleInvalidExtension(file, ext) {
		this.error(`Invalid extension: ${ext}`);
		return false;
	}

	handleFiles(files) {
		if (files.length > 1) {
			const cont = this.handleMultipleFiles();
			if (!cont) { return; }
		} else if (files.length == 0) {
			// Do nothing?
			return;
		}
		const file = files[0];
		if (this.validateExtension) {
			const fileDotSplits = file.name.split('.');
			const ext = fileDotSplits[fileDotSplits.length - 1];
			if (ext !== this.validateExtension) {
				const cont = this.handleInvalidExtension(file, ext);
				if (!cont) { return; }
			}
		}
		this.setContainerWorking();
		this.parseFile(file);
	}

	finish() {
		this.resetContainer();
	}

	handleStep(results, parser) {
		const abort = (msg) => {
			this.error(msg);
			parser.abort();
		};
		if (true) { // TODO: only do on row 1
			if (!results.meta.fields) {
				abort('No header found');
				return;
			}
			let missedExpectedColumns = false;
			if (this.strictHeaderOrder && !this.matchHeaderOrder(results.meta.fields, this.headerOrder)) {
				missedExpectedColumns = this.headerOrder;
			}
			if (!this.matchHeaders(results.meta.fields, this.columns)) {
				missedExpectedColumns = Object.keys(this.columns);
			}
			if (missedExpectedColumns) {
				abort(
					`Incorrect column headers.
					Expecting: ${missedExpectedColumns.join(', ')},
					but found: ${results.meta.fields.join(', ')}`
				);
				return;
			}
		}
		console.log("Step -", results, parser);
		if (results.errors.length > 1) {
			// TODO: track the errors
			this.warn('ERRORS');
			// parser.abort();
			return;
		}
		const continueCallback = () => { parser.resume(); };

		parser.pause();
		this.save(results.data, continueCallback);
		// parser.resume();
	}

	handleSave(data) { // TODO: Switch to async/await or callback
		// console.log('Save', data);
	}

	handleError(msg) {
		this.warn(msg);
	}

	//----- Parsing

	parseFile(file) {
		const parseOptions = this.getParseOptions();
		// console.log(file, parseOptions);
		Papa.parse(file, parseOptions);
	}

	getParseOptions() {
		const step = (results, parser) => {
			this.step(results, parser);
		};
		const complete = (results, file) => { this.finish(); }
		const parseOverrides = {
			step,
			complete,
			dynamicTyping: this.dynamicTyping,
			skipEmptyLines: this.skipEmptyLines
		};
		const parseOptions = Object.assign({}, defaultParseOptions, parseOverrides);
		return parseOptions;
	}

	matchHeaders(arr = [], columns = {}) {
		for (let i = 0; i < arr.length; i++) {
			if (!Boolean(columns[arr[i]])) {
				return false;
			}
		}
		return true;
	}

	matchHeaderOrder(arr1 = [], arr2 = []) {
		if (arr1.length !== arr2.length) {
			return false;
		}
		for (let i = 0; i < arr1.length; i++) {
			if (arr1[i] !== arr2[i]) {
				return false;
			}
		}
		return true;
	}

	//----- DOM

	getContainerElement() {
		return this.doc.getElementById(this.fileSelectionContainerId);
	}

	getResetButton() {
		const fullSelector = `#${this.fileSelectionContainerId} ${this.fileSelectionResetSelector}`;
		return this.doc.querySelector(fullSelector);
	}

	setContainerWorking() {
		this.getContainerElement().classList.add(this.workingClass);
	}

	resetContainer() {
		this.getContainerElement().classList.remove(this.workingClass);
	}

	enableResetButton(enable = true) {
		// TODO: set based on whether there is a file or not
		this.getResetButton().disabled = !enable;
	}

	//----- Event Handling

	onDrop(e) {
		this.doNothing(e);
		const dt = e.dataTransfer;
		const files = dt.files;
		this.enableResetButton();
		this.handleFiles(files);
	}

	static doNothing(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	//----- Setup

	setup(doc) {
		this.setupReset(doc);
		this.setupFileSelection(doc);
		this.setupDrop(doc);
	}

	setupFileSelection(doc) {
		if (!this.fileSelectorId) {
			return false;
		}
		const fileSelector = doc.getElementById(this.fileSelectorId);
		if (fileSelector === null) {
			this.warn('Could not find file selection element with ID', this.fileSelectorId);
			return false;
		}
		const handleFilesInternal = (files) => {
			this.enableResetButton();
			this.handleFiles(files);
		};
		fileSelector.onchange = function onFileSelectionChange(onChangeEvent) {
			handleFilesInternal(this.files);
		};
	}

	setupDrop(doc) {
		if (!this.fileDropId) {
			return false;
		}
		const drop = doc.getElementById(this.fileDropId);
		if (drop === null) {
			this.warn('Could not find file selection element with ID', this.fileDropId);
			return false;
		}
		const dragEnter = (e) => { return this.doNothing(e); };
		const dragOver = (e) => { return this.doNothing(e); };
		const onDrop = (e) => { return this.onDrop(e); };
		drop.addEventListener('dragenter', dragEnter, false);
		drop.addEventListener('dragover', dragOver, false);
		drop.addEventListener('drop', onDrop, false);
		return true;
	}

	setupReset() {
		const resetButton = this.getResetButton();
		if (resetButton === null) {
			this.warn('No reset button found');
			return false;
		}
		this.enableResetButton(false);
		resetButton.addEventListener('click', () => { this.enableResetButton(false); });
		return true;
	}

	setupWhenDomReady(doc) {
		doc.addEventListener('DOMContentLoaded', () => {
			this.setup(doc);
		});
	}
}

