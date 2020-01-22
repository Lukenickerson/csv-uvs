
const defaultParseOptions = {
	delimiter: ",",
	newline: "", // auto-detect
	quoteChar: '"',
	escapeChar: '"', // TODO: Is this standard? Does XLS use this?
	header: false,
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
		// Options
		this.validateExtension = String(config.validateExtension);
		// Error handling
		this.warn = config.warn || console.warn;
		// Papa config
		this.dynamicTyping = config.dynamicTyping;
		this.skipEmptyLines = config.skipEmptyLines;
		// Callbacks
		this.step = (typeof config.step === 'function') ? config.step : this.handleStep;
		this.save = (typeof config.save === 'function') ? config.save : this.handleSave;
	}

	//----- Default Handlers

	handleMultipleFiles() {
		alert('Can only handle one file at a time.');
		return false;
	}

	handleInvalidExtension(file, ext) {
		alert('Invalid extension');
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
		this.parseFile(file);
	}

	handleStep(results, parser) {
		// console.log("Step -", results);
		if (results.errors.length > 1) {
			this.warn('ERRORS');
		} else {
			parser.pause();
			this.save(results.data); // TODO: Switch to async/await or callback
			parser.resume();
		}
	}

	handleSave(data) { // TODO: Switch to async/await or callback
		console.log('Save', data);
	}

	//----- Parsing

	parseFile(file) {
		const parseOptions = this.getParseOptions();
		// console.log(file, parseOptions);
		Papa.parse(file, parseOptions);
	}

	getParseOptions() {
		const parseStep = (results, parser) => {
			this.step(results, parser);
		};
		const parseOverrides = {
			step: parseStep,
			dynamicTyping: this.dynamicTyping,
			skipEmptyLines: this.skipEmptyLines
		};
		const parseOptions = Object.assign({}, defaultParseOptions, parseOverrides);
		return parseOptions;
	}

	//----- Event Handling

	onDrop(e) {
		this.doNothing(e);
		const dt = e.dataTransfer;
		const files = dt.files;
		this.handleFiles(files);
	}

	static doNothing(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	//----- Setup

	setup(doc) {
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

	setupWhenDomReady(doc) {
		doc.addEventListener('DOMContentLoaded', () => {
			this.setup(doc);
		});
	}
}

