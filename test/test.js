var expect = require('chai').expect;

var express = require('express');
var app;

var parameters = require('../source/parameters.js');
var response = require('../source/generate_response.js');

var limit = 1;
var sortBy = "DESC";
var from = null;
var to = null;
var length_limit = null;

describe('Parameter test', function() {
    describe('Indent test', function() {
        this.beforeEach(function() {
            app = express();
        });

        it('Indent test: correct entry #1', function(done) {
            expect(parameters.setIndent("TRUE", app)).to.equal(2);
            done();
        });
    
        it('Indent test: correct entry #2', function(done) {
            expect(parameters.setIndent("true", app)).to.equal(2);
            done();
        });
    
        it('Indent test: correct entry #3', function(done) {
            expect(parameters.setIndent("tRue", app)).to.equal(2);
            done();
        });
    
        it('Indent test: incorrect entry #1', function(done) {
            expect(parameters.setIndent("false", app)).to.equal(0);
            done();
        });

        it('Indent test: incorrect entry #2', function(done) {
            expect(parameters.setIndent("False", app)).to.equal(0);
            done();
        });

        it('Indent test: incorrect entry #3', function(done) {
            expect(parameters.setIndent("faLSe", app)).to.equal(0);
            done();
        });

        it('Indent test: incorrect entry #4', function(done) {
            expect(parameters.setIndent("asd", app)).to.equal(0);
            done();
        });

        it('Indent test: incorrect entry #5', function(done) {
            expect(parameters.setIndent("testTin2g", app)).to.equal(0);
            done();
        });
    });

    describe('Parameter checking', function() {
        
        this.beforeEach(function() {
            limit = 1;
            sortBy = "DESC";
            from = null;
            to = null;
            length_limit = null;
        })

        describe('Check limit', function() {
            it ('Check limit #1', function(done) {

                limit = -2;
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(limit).to.equal(1);
                    done();
                });
            });
    
            it ('Check limit #2', function(done) {
    
                limit = -2;
                length_limit = 2;
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(limit).to.equal(1);
                    done();
                });
            });
    
            it ('Check limit #3', function(done) {
    
                limit = "asdsss";
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(limit).to.equal(1);
                    done();
                });
            });
    
            it ('Check limit #4', function(done) {
    
                limit = 220;
                length_limit = 15
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(limit).to.equal(15);
                    done();
                });
            });
    
            it ('Check limit #5', function(done) {
    
                limit = 21220;
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(limit).to.equal(21220);
                    done();
                });
            });
        });

        describe('Check sortBy', function() {
            it ('Check sortBy #1', function(done) {

                sortBy = "desC";
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(sortBy).to.equal("DESC");
                    done();
                });
            });
    
            it ('Check sortBy #2', function(done) {
    
                sortBy = "asc";
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(sortBy).to.equal("ASC");
                    done();
                });
            });
    
            it ('Check sortBy #3', function(done) {
    
                sortBy = "ASC";
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(sortBy).to.equal("ASC");
                    done();
                });
            });
    
            it ('Check sortBy #4', function(done) {
    
                sortBy = "ASasdC";
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(sortBy).to.equal("DESC");
                    done();
                });
            });
        });

        describe('Check where', function() {
            it ('Check where #1', function(done) {
    
                from = "asd"
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal("");
                    done();
                });
            });

            it ('Check where #2', function(done) {
    
                from = "asd"
                to = "7d"
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal(" WHERE time < now() - 7d");
                    done();
                });
            });

            it ('Check where #3', function(done) {
    
                from = "2h"
                to = "asd"
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal(" WHERE time > now() - 2h");
                    done();
                });
            });

            it ('Check where #4', function(done) {
    
                from = 22222
                to = "2h"
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal(" WHERE time < now() - 2h");
                    done();
                });
            });

            it ('Check where #5', function(done) {
    
                from = "7s"
                to = 323
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal(" WHERE time > now() - 7s");
                    done();
                });
            });

            it ('Check where #6', function(done) {
    
                from = "7p"
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal("");
                    done();
                });
            });

            it ('Check where #7', function(done) {
    
                from = "22h"
                to = "12a"
    
                parameters.checkParameters(limit, sortBy, from, to, length_limit, function(limit, sortBy, where) {
                    expect(where).to.equal(" WHERE time > now() - 22h");
                    done();
                });
            });
        });
    });
});

describe('Generate response testing', function() {
    // TODO
});

