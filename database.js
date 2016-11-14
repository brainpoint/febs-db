'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var mysql   = require('mysql');
var citong   = require('citong');
var database_connection = require('./database_connection');
var assert   = require('assert');
var co       = require('co');

const PING_INTERVAL = 1000*60*2;

module.exports = class {
  constructor(opt) {
    // create.
    this.pool = mysql.createPool(opt);

    this.queryTimeout = opt.queryTimeout || 5000;

    // ping pool.
    this._pingConnections = [];

    var ctx = this;
    var pingFoo = function(interval) {
      setTimeout(function(){
        co(function* () {
          let dis_conns = [];
          let nextT = PING_INTERVAL;
          let now = (new Date()).getTime();
          for (let i = 0; i < ctx._pingConnections.length; i++)
          {
            let t = yield ctx._pingConnection(ctx._pingConnections[i], now);
            if (t == -1)
              dis_conns.push(ctx._pingConnections[i][0]);
            else {
              if (t < nextT)  nextT = t;
            }
          }

          for (let i = 0; i < dis_conns.length; i++) {
            ctx._removeFromPingPool(dis_conns[i]);
          }
          //pingFoo(nextT/2);
          pingFoo(nextT);
        });
      }, interval);
    }

    pingFoo(0);
  }

  get client() {
    return this.pool;
  }

  /**
   * @desc: get the connection for transaction.
   * @return: database_connection.
   */
  *getConnection() {
    try {
      let ret = yield citong.utils.denodeify(this.pool.getConnection, this.pool)();
      if (ret) {
        this._addToPingPool(ret);
      }
      return ret ? (new database_connection(ret, this)) : null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  _addToPingPool( connection ) {
    for (let i = 0; i < this._pingConnections.length; i++) {
      if (this._pingConnections[i][0] == connection) {
        this._pingConnections[i][1] = (new Date()).getTime();
        return;
      }
    }

    this._pingConnections.push([connection, (new Date()).getTime()]);
  }

  _removeFromPingPool( connection ) {
    for (let i = 0; i < this._pingConnections.length; i++) {
      if (this._pingConnections[i][0] == connection) {
        this._pingConnections.splice(i, 1);
        break;
      }
    }
  }

  // @return next time, -1:err
  *_pingConnection( elem, now ) {
    let connection = elem[0];
    let pretime = elem[1];
    assert(now > pretime, '_pingConnection error params');
    let e = now-pretime;

    // ping.
    if (e > PING_INTERVAL) {
      try {
        yield citong.utils.denodeify(connection.ping, connection)();
        elem[1] = now;
        return PING_INTERVAL;
      } catch (e) {
        connection.destroy();
        return -1;
      }
    } else {
      return PING_INTERVAL-e; 
    }
  }

};
