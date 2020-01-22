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
		headerOrder: ['NAME', 'BIRTHDAY', 'SIBLINGS'], // TODO
		strictHeaderOrder: false, // TODO
		strictHeaderCase: false, // TODO
		validateExtension: 'csv',
		discardExtraColumns: false, // TODO
		preview: 10, // TODO: Used for validation

		// PapaParse options
		dynamicTyping: false,
		skipEmptyLines: true,
		// DOM config
		fileSelectorId: 'file-selection',
		fileDropId: 'file-selection-drop',
		// Handlers
		save: (result) => { console.log('SAVE:', result); },
	};

	const uvs = new Uvs(config);
	uvs.setupWhenDomReady(window.document);
})();
