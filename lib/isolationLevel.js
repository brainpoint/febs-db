'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

module.exports = {
  /**
  * @desc: 允许事务读取另外一个事务中未commit的数据. (脏读)
  */
  Read_uncommitted : 'read_uncommitted',
  /**
  * @desc: 一个事务读取数据,另外一个事务也可以读取此数据并且进行更新提交. (不可重复读)
  */
  Read_committed   : 'read_committed',
  /**
  * @desc: 不同事务互相不影响, 即使其中一个事务修改了数据并提交, 另一个事务还是查询到原来的数据. (幻读)
  */
  Repeatable_read  : 'repeatable_read',
  /**
  * @desc: 一个事务进行数据查询后, 并且在事务提交之前, 其他事务不允许修改此数据.
  *        查询操作就将锁住数据, 避免其他事务修改. 但读共享.
  */
  Serializable     : 'serializable',
}