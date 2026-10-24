'use strict';
// Source-owned launch allocation: one web process per app; count replicas and maintenance against the cluster's 75 connections.
module.exports = Object.freeze({ app: 'figur', total: 6, workers: 0 });
