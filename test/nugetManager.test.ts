"use strict";

// 
// note: This test is leveraging the Mocha test framework.
// please refer to their documentation on https://mochajs.org/ for help.
//

// the module 'assert' provides assertion methods from node
import * as assert from "assert"; 

import * as vscode from "vscode";

import * as mockfs from "mock-fs";

import "should";

// you can import and use all API from the 'vscode' module
// as well as import your extension to test it
import NugetManager from "../src/nugetManager";

suite("Nuget4Code Tests", () => {
	setup(() => {
		mockfs(
			{
				"invalid.json": "random",
				"withTestPackage.json": '{ "dependencies" : { "testPackage": "1.0.0" } }'
			});
		});

	teardown(mockfs.restore);

	test("getQueryUri", () => {
		// arrange
		var nugetManager: any = new NugetManager(false);
		nugetManager.queryEndpoint = "htts://example:4242/";

		// act
		var value:Object = nugetManager.getQueryUri("random");

		// assert
		value.should.startWith(nugetManager.queryEndpoint);
		value.should.containEql("random");
	});

	test("queryPackage is working without internet", (done: MochaDone) => {
		// arrange
		var nugetManager: any = new NugetManager(false);
		nugetManager.queryEndpoint = "htts://example:4242/";
		nugetManager.endPointsInitialization = Promise.reject("unit rest");
		nugetManager.getJsonResponse = () => { throw "should not be called"; };

		// act
		nugetManager.queryPackage("random")
				.then ( (packages: any[]) => {
					try
					{
						packages.length.should.be.equal(0);
						done();
					} catch (e) { done(e); }
				}, (reason: any) => {
					done(new Error(reason.toString()));
				 });

		// assert
	});

	test("removePackage is not working on invalid file", (done: MochaDone) => {
		// arrange
		var nugetManager: NugetManager = new NugetManager(false);

		var nugetManagerPrivate: any = nugetManager;
		nugetManagerPrivate.getCurrentProjectFile = () => Promise.resolve( vscode.Uri.file("invalid.json"));

		// act
		var thenable: Thenable<void>  = nugetManager.removePackage({ id: "MySql.Data.Entity", version: ""});

		// assert
		thenable.then ( () => { done( new Error("not expected path")); } ,
						() => { done(); });
	});

	test("removePackage is not working on valid file / missing package", (done: MochaDone) => {
		// arrange
		var nugetManager: NugetManager = new NugetManager(false);

		var nugetManagerPrivate: any = nugetManager;
		nugetManagerPrivate.getCurrentProjectFile = () => Promise.resolve( vscode.Uri.file("withTestPackage.json"));

		// act
		var thenable: Thenable<void>  = nugetManager.removePackage({ id: "MySql.Data.Entity", version: ""});

		// assert
		thenable.then ( () => { done( new Error("not expected path")); } ,
						() => { done(); });
	});

	test("removePackage is working as expected", (done: MochaDone) => {
		// arrange
		var nugetManager: NugetManager = new NugetManager(false);

		var nugetManagerPrivate: any = nugetManager;
		nugetManagerPrivate.getCurrentProjectFile = () => Promise.resolve( vscode.Uri.file("withTestPackage.json"));

		// act
		var thenable: Thenable<void>  = nugetManager.removePackage({ id: "testPackage", version: ""});

		// assert
		thenable.then ( () => { done(); } ,
						() => { done(new Error("not expected path")); });
	});

	test("removePackage after removePackage is working as expected", (done: MochaDone) => {
		// arrange
		var nugetManager: NugetManager = new NugetManager(false);

		var nugetManagerPrivate: any = nugetManager;
		nugetManagerPrivate.getCurrentProjectFile = () => Promise.resolve( vscode.Uri.file("withTestPackage.json"));

		// act
		var thenable: Thenable<void> = nugetManager
			.removePackage({ id: "testPackage", version: ""})
			.then ( () => nugetManager.removePackage({ id: "testPackage", version: ""}));

	 	// assert
		thenable.then ( () => { done(new Error("not expected path")); } ,
						() => { done(); });
	});

});
