(function(){

	const config = {
		columns: { // TODO: 
			"NAME": {
				type: "string"
			},
			"BIRTHDAY": {
				type: "string"
			},
			"SIBLINGS": {
				type: "number"
			}
		},
		headerOrder: ['NAME', 'BIRTHDAY', 'SIBLINGS'],
		strictHeaderOrder: false,
		strictHeaderCase: false, // TODO
		validateExtension: 'csv',
		discardExtraColumns: false, // TODO
		preview: 10, // TODO: Used for validation

		// PapaParse options
		dynamicTyping: false,
		skipEmptyLines: true,
		// DOM config
		document: window.document,
		fileSelectionContainerId: 'file-selection-container',
		fileSelectorId: 'file-selection',
		fileDropId: 'file-selection-drop',
		fileSelectionResetSelector: '.file-selection-reset',
		workingClass: 'working',
		// Handlers
		save: (result, continueCallback) => {
			console.log('SAVE:', result);
			window.setTimeout(() => { continueCallback(); }, 100);
		},
		error: (message) => {
			window.document.querySelector('#file-selection-container .errors').append(message);
		},
	};

	const uvs = new Uvs(config);
	uvs.setupWhenDomReady(window.document);

	window.uvs = uvs;
})();
