citong db库用于连接数据库,目前仅支持mysql

- [exception](#exception)
- [define-table](#define-table)
- [combined-primary-key](#combined-primary-key)
- [connect-db](#connect-db)
- [exist](#exist)
- [query](#query)
- [query-Lock-Row](#query-Lock-Row)
- [count](#count)
- [add](#add)
- [update](#update)
- [remove](#remove)
- [transaction](#transaction)
- [Class:database_table_base](#class-database_table_base)

## exception
定义了常用的错误类型.
异常是如下的对象: {msg, code, filename, line}; 其中code有如下意义

```js
// @desc: 数据查询条件错误。参数语句问题.
exception.DB_ERROR_SQL
// @desc: 数据连接问题.
exception.DB_ERROR_CONNECT
// @desc: 数据执行错误.
exception.DB_ERROR
```
事务处理中发生异常将自动rollback.

## define table.
***
```js
var citong_table   = require('.').table;

class TableDemo extends citong_table {
  constructor(dbclient) {
    super(
      dbclient, // database
      'Admin',  // table name.
      'ID',     // primary key.
      {         // cols.
        ID:       {type: 'integer', size: 8, key: true}, // the auto-incrementing
        Name:     {type: 'text',    size:10},
        NumberCol:{type: 'number',  size: 4},
        IntCol:   {type: 'integer', size: 4},
        IntCol:   {type: 'integer', size: 8}, // big int.
        BoolCol:  {type: 'boolean'}
      }
    );
  }
}
```
example:
```js
var database  = require('citong-db').database;

var db = new database({});
var tableDemo = new TableDemo(db);
```


## combined primary key
***
```js
var citong_table   = require('.').table;

class TableDemo extends citong_table {
  constructor(dbclient) {
    super(
      dbclient, // database
      'Admin',  // table name.
      ['ID', 'IntCol'],     // primary keys.
      {         // cols.
        ID:       {type: 'integer', size: 8},
        Name:     {type: 'text',    size:10},
        NumberCol:{type: 'number',  size: 4},
        IntCol:   {type: 'integer', size: 4, key: true},  // the auto-incrementing
        IntCol:   {type: 'integer', size: 8}, // big int.
        BoolCol:  {type: 'boolean'}
      }
    );
  }
}
```

## connect db.
***
see [mysql](https://www.npmjs.com/package/mysql#pool-options) pool-options.
```js
var database = require('citong-db').database;

var opt = {
  connectionLimit   : 10,
  supportBigNumbers : true,
  bigNumberStrings  : false,
  host              : '',
  port              : 3306,
  user              : '',
  password          : '',
  database          : '',

  /* ext */
  queryTimeout      : 5000,
};
var db = new database(opt);
var table = new TableDemo(db);
```


## exist.
***
```js
function* isExist() {
  let r;
  r = yield table.isExist(1);
  r = yield table.isExistWhere("id=43");
}
```

## query.
***
```js
function* query() {
  let r;
  r = yield table.queryById(1);
  r = yield table.queryById(1, ['ID','Name']);      // only query 'ID','Name' cols.

  r = yield table.queryTop("id = 43");
  r = yield table.queryTop("id = 43", ['ID','Name']);  // only query 'ID','Name' cols.

  let where = table.make_condition('id', 43); // == " `id`=43 ".
  where = table.make_condition_like('name', '%dfdfd%'); // == " `name` LIKE '%dfdfd%' ".
  r = yield table.queryTop(where);

  r = yield table.queryWhere(where, [0, 100], {ID:true});       // where id = 43 limit 0,100 order by id asc.
  r = yield table.queryWhere(where, ['ID', 'Name']);            // only query 'ID','Name' cols.
  r = yield table.queryWhere(where, [0, 100],  ['ID', 'Name']); // only query 'ID','Name' cols. limit 0,100
  r = yield table.queryWhere(where, {ID:true}, ['ID', 'Name']); // only query 'ID','Name' cols. orderby ID
  r = yield table.queryWhere(where, ['COUNT(ID) as x']);
}
```


## query Lock Row.
***
```js
function* queryLockRow() {

  var conn = yield global.db.getConnection();
  if (conn)
  {
    return yield conn.transaction(function*(){

      // lock row id = 1, and unlock after update or exit transaction.
      let r;
      r = yield table.queryLockRow(1, conn);
      // or.
      r = yield table.queryLockRow(1, ['col1','col2'], conn);


      return false; // will rollback.
      return true;  // will commit.
    });
  }
}
```

## count.
***
```js
function* query() {
  let r;
  let where = table.make_condition('id', 43); // == " `id`=43 ".
  r = yield table.count(where);
}
```

## add.
***
```js
function* add() {
  var r = yield table.add({ID:8,...});
}
```

## update.
***
```js
function* update() {
  var mod = {
    ID: 1,
    name:"name",
    intCol:table.make_update_inc(1),
    intCol2:table.make_origin_sql('`intCol2`+1')
  };
  var r = yield table.update(mod);  // ID=1,name="name",intCol=intCol+1,intCol2=intCol2+1
}
```

## remove.
***
```js
function* remove() {
  var r = yield table.remove(where);
}
```

## transaction.
***
```js
function* transaction() {
  var conn = yield global.db.getConnection();
  if (conn)
  {
    return yield conn.transaction(function*(){
      // attach conn.
      console.log((yield table.add(mod, conn)));

      mod.id = 1;
      mod.name = 'a1';
      console.log((yield table.update(mod, conn)));

      return false; // will rollback.
      return true;  // will commit.
    });
  }
}
```

# Class database_table_base

- [constructor](#constructor)
- [isExist](#isxist)
- [isExistWhere](#isexistwhere)
- [count](#count-1)
- [add](#add-1)
- [remove](#remove-1)
- [update](#update-1)
- [queryById](#querybyId)
- [queryLockRow](#querylockrow)
- [queryTop](#querytop)
- [queryWhere](#querywhere)
- [get_conn](#get_conn)
- [escape](#escape)
- [make_condition](#make_condition)
- [make_condition_not_equal](#make_condition_not_equal)
- [make_condition_more](#make_condition_more)
- [make_condition_more_equal](#make_condition_more_equal)
- [make_condition_less_equal](#make_condition_less_equal)
- [make_condition_less](#make_condition_less)
- [make_condition_like](#make_condition_like)
- [make_update_inc](#make_update_inc)

所有的数据库查询方法都存在相应的同步调用方式, 如: queryWhereSync();

***
### constructor.
```js
/**
* @param client: 数据库对象.
* @param tablename: 本表名.
* @param idKeyName: 本表主键列表, 如果为单主键可以直接为字符串, 如果为联合多主键则需要为数组.
* @param model: 本表模型.
*/
*constructor(client, tablename, idKeyName, model)
```

> model的定义格式如下:

> {<br>
    colName: {type: 'integer', size: 8, key: true}, // the auto-incrementing<br>
    ...<br>
  }

- colName: 表示列名称
- type: 表示列类型

  | 类型 | 说明 | size |
  |------|--------|----|
  | 'integer' | 整型  | 指明字节长度 |
  | 'text' | 字符串   | 指明字符长度 |
  | 'number' | 浮点型 | 指明字节长度 |
  | 'boolean' | 布尔型| 无意义 |

- size: 字段长度
- key:  是否是自增键; (同一个表只能有一个自增键, 当指定多个自增键时, 只认为最后一个为自增)


***
### isExist.
```js
/**
* @desc: isExist
*         id is Array if table is combined primary. 
*         the last param can be conn.
* @return: boolean.
*/
*isExist( id )
/**
* @desc: isExist
*         id is Array if table is combined primary. 
*         the last param can be conn.
* @param id, cb
*         - cb: function(err, r:boolean)  {}
*/
isExistSync( id, cb )
```

***
### isExistWhere.
```js
/**
* @desc: isExitWhere
*         the last param can be conn.
* @return: boolean.
*/
*isExistWhere( where )
/**
* @desc: isExitWhere
*         the last param can be conn.
* @param where, cb
*         - cb: function(err, r:boolrean)  {}
*/
isExistWhereSync()
```

***
### count.
```js
/**
* @desc: count
*         the last param can be conn.
* @param: where
* @return: int.
*/
*count()
/**
* @desc: count
*         the last param can be conn.
* @param: where, cb
*           - cb: function(err, ret:int)  {}
*/
countSync()
```

***
### add.
```js
/**
* @desc: add
*         the last param can be conn.
*         (insertId will set to item.id)
* @return: bool
*/
*add( item )
/**
* @param cb: cb(err, r:boolean)  {}
* @return: void
*/
addSync( item, cb )
```

***
### remove.
```js
/**
* @desc: remove
*         the last param can be conn.
* @return: bool.
*/
*remove( where )
/**
* @param cb: cb(err, r:boolean)  {}
* @return:.
*/
removeSync( where, cb )
```

***
### update.
```js
/**
* @desc: update;  where id = item.id
*         if item.id is existed, sql condition is: 'id=value' AND (where)
*         otherwise sql condition is: where 
*         the last param can be conn.
* @param item, where.
* @return: boolean.
*/
*update( item )
/**
* @desc: update;  where id = item.id
*         if item.id is existed, sql condition is: 'id=value' AND (where)
*         otherwise sql condition is: where 
*         the last param can be conn.
* @param item, where, cb.
*         - cb: function(err, r:boolrean) {}
* @return:.
*/
updateSync( item )
```

***
### queryById.
```js
/**
* @desc: query by id.
*         id is Array if table is combined primary. 
*         the last param can be conn.
* @param: id, [query_cols]
*           query_cols: [col1,col2], the cols will be query.
* @return: mod.
*/
*queryById( id )
/**
* @desc: query by id.
*         id is Array if table is combined primary.
*         the last param can be conn.
* @param: id, [query_cols], cb
*          - query_cols: [col1,col2], the cols will be query.
*          - cb: function(err, ret:mod) {}
*/
queryByIdSync( id )
```

***
### queryLockRow.
```js
/**
* @desc: query by id and lock row for update (use in transaction).
*         id is Array if table is combined primary.
*         the last param can be conn.
* @param: id, [query_cols]
*           query_cols: [col1,col2], the cols will be query.
* @return: mod.
*/
*queryLockRow( id )
/**
* @desc: query by id and lock row for update (use in transaction).
*         id is Array if table is combined primary.
*         the last param can be conn.
* @param: id, [query_cols], cb
*           - query_cols: [col1,col2], the cols will be query.
*           - cb: function(err, ret:mod)  {}
* @return: mod.
*/
queryLockRowSync( id )
```

***
### queryTop.
```js
/**
* @desc: query top.
*         the last param can be conn.
* @param: where, {orderby}, [query_cols]
*           orderby: {key:true/false} true-means asc, false-means desc.
*           query_cols: [col1,col2], the cols will be query.
* @return: mod.
*/
*queryTop( where )
/**
* @desc: query top.
*         the last param can be conn.
* @param: where, {orderby}, [query_cols], cb
*           - orderby: {key:true/false} true-means asc, false-means desc.
*           - query_cols: [col1,col2], the cols will be query.
*           - cb: function(err, ret:mod)  {}
*/
queryTopSync( where )
```
***
### queryWhere.
```js
/**
* @desc: query
*         the last param can be conn.
* @param: where, [offset,limit], {orderby}, [query_cols]
*           - orderby: {key:true/false} true means asc, false means desc.
*           - query_cols: [col1,col2], the cols will be query. e.g. ['id', 'name']
* @return: [mod,mod,...].
*/
*queryWhere( where )
/**
* @desc: query
*         the last param can be conn.
* @param: where, [offset,limit], {orderby}, [query_cols]
*           - orderby: {key:true/false} true means asc, false means desc.
*           - query_cols: [col1,col2], the cols will be query. e.g. ['id', 'name']
*           -cb:  function(err, ret:Array)  {}
*/
queryWhereSync( where )
```
***
### get_conn.
```js
/**
* @desc: 获得最后一个参数,如果为 database_connection则返回.
* @return:
*/
get_conn(arguments)
```
***
### escape.
```js
/**
* @desc: escape
* @return: str.
*/
escape( v )
```
***
### make_condition.
```js
/**
* @desc: 构造一个 key=value的sql条件语句.
* @return: sql;
*/
make_condition( key, value )
```
***
### make_condition_not_equal.
```js
/**
* @desc: 构造一个 key<>value的sql条件语句.
* @return: sql;
*/
make_condition_not_equal( key, value )
```
***
### make_condition_more.
```js
/**
* @desc: 构造一个 key>value的sql条件语句.
* @return: sql;
*/
make_condition_more( key, value )
```
***
### make_condition_more_equal.
```js
/**
* @desc: 构造一个 key>=value的sql条件语句.
* @return: sql;
*/
make_condition_more_equal( key, value )
```
***
### make_condition_less_equal.
```js
/**
* @desc: 构造一个 key<=value的sql条件语句.
* @return: sql;
*/
make_condition_less_equal( key, value )
```
***
### make_condition_less.
```js
/**
* @desc: 构造一个 key<value的sql条件语句.
* @return: sql;
*/
make_condition_less( key, value )
```
***
### make_condition_like.
```js
/**
* @desc: 构造一个 key LIKE value的sql条件语句.
* @return: sql;
*/
make_condition_like( key, value )
```
***
### make_update_inc.
```js
/**
* @desc: 用于表明update时字段自增n.
*/
make_update_inc( n )
```
***
### make_update_inc.
```js
/**
* @desc: 用于表明使用原始v, 不做安全检验.
*/
make_origin_sql( v )
```
