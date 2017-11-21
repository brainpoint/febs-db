febs db库用于连接数据库

`febs-db是在citong-db@1.5.3基础上进行开发, citong-db库已停止更新`

(v0.0.3及之前版本接口已经不适用, 请查看使用说明[README-v0.0.3](./README-v0.0.3.md))

目前支持 `mysql`, `mssql`; 其中 mysql请使用`InnoDB`引擎.

- [Install](#install)
- [Exception](#exception)
- [1.Define Table](#define-table)
  - [register table](#register-table)
  - [combined primary key](#combined-primary-key)
  - [column data type](#column-data-type)
  - [name map](#name-map)
- [2.Connect db](#connect-db)
- [3.Query db](#query-db)
  - [add](#add)
  - [remove](#remove)
  - [update](#update)
  - [count](#count)
  - [exist](#exist)
  - [select](#select)
  - [selectLockRow](#selectlockrow)
  - [store procedure](#store-procedure)
  - [condition](#condition)
- [4.Transaction](#transaction)
  - [isolation level](#isolation-level)
- [Class database API](#class-database-api)
- [Class tablebase API](#class-tablebase-api)
- [Class condition API](#class-condition-api)
- [Class dataType API](#class-datatype-api)

# Install

Use npm to install:

```js
npm install febs-db --save
```

 febs-db是一个orm库, 主要的类为:

> `database`: 代表一个数据库; 可以用于执行sql语句, 进行事务等操作.

> `tablebase`: 代表一个数据库表; 针对表的基本操作在这个对象中完成;

> `dataType`: 数据表的字段类型定义

> `condition`: 进行查询条件构造,会对类型与值进行类型检查. 每个表对象都有一个此对象, 使用 tablebase.condition 获取对象.

> `procedureParams`: 调用存储过程时, 用于构建参数.

# Exception

系统在错误发生时会抛出`exception`类型的异常

事务处理中发生异常将自动rollback.

异常类如下
```js
/**
* @desc: 构造异常对象.
* @param msg: 异常消息
* @param errcode: 异常代码
* @param filename: 异常文件名
* @param line: 异常文件所在行
*/
exception(msg, errcode, filename, line)
```
例子:
```js
var exception = require('febs-db').exception;
try {
  ...
} catch (e) {
  if (e instanceof exception) {
    if (e.code == exception.DB_SqlException) {
      // 查询语句错误.
    }
  } else {
    throw e;
  }
}
```

定义了常用的错误code.

```js
// @desc: 通用错误.
exception.DB_CommonException
// @desc: 数据查询条件错误。sql语句问题.
exception.DB_SqlException
// @desc: 数据库连接问题.
exception.DB_ConnectException
// @desc: 数据库查询时产生的问题, 可能是数据库服务器问题, 或是并发产生的事务锁问题等.
exception.DB_QueryException
```

# Define-table

操作一个数据表之前, 需要先对表结构进行定义, 与数据不匹配的定义在执行数据操作时会报错. 数据列可以仅列出需要操作的列.

```js
var tablebase = require('febs-db').tablebase;
var dataType  = require('febs-db').dataType;

class TableDemo extends tablebase {
  constructor() {
    super(
      'User',   // table name.
      'ID',     // primary key.
      {         // cols.
        ID:       {type: dataType.BigInt(true), key: true}, // key means auto-incrementing
        Name:     {type: dataType.Varchar(10)},
        NumberCol:{type: dataType.Float()},
        IntCol:   {type: dataType.Int(false)},
        BoolCol:  {type: dataType.Bit()}
      }
    );
  }
}
```
## register table
```js
var database  = require('febs-db').database;

class dbAgent extends database {
  constructor() {
    // 数据库对象.
    super('mysql', {});

    // 注册数据表.
    this.registerTable(new TableDemo(), 'mapName');
  }
}

// 使用此对象进行数据库操作, 存储至全局对象中, 所有的用户连接可以使用同一个对象. 内部使用连接池重复利用数据库连接.
global.dbagent = new dbAgent();
```

## combined primary key

```js
var tablebase     = require('febs-db').tablebase;
var dataType      = require('febs-db').dataType;

class TableDemo extends tablebase {
  constructor() {
    super(
      'Admin',  // table name.
      ['ID', 'IntCol'],     // primary keys.
      {         // cols.
        ID:       {type: dataType.BigInt(true), key: true}, // the auto-incrementing
        Name:     {type: dataType.Varchar(10), map:'Name1'},
        NumberCol:{type: dataType.Float()},
        IntCol:   {type: dataType.Int(false)},
        BoolCol:  {type: dataType.Bit()}
      }
    );
  }
}
```

## column data type

目前支持如下的数据类型. 数据类型定义在`dataType`类型中

|  类型  | 对应创建方法 | 说明 |
|-------|----|---|
| `VarChar` | dataType.VarChar(length)   | |
| `NVarChar` | dataType.NVarChar(length)   | |
| `Text` | dataType.Text()   | |
| `NText` | dataType.NText()   | |
| `Char` | dataType.Char(length)   | |
| `NChar` | dataType.NChar(length)   | |
| `Bit` | dataType.Bit()   | 对应`boolean`类型 |
| `BigInt` | dataType.BigInt(unsigned)   | 当数值在Number.MAX_SAFE_INTEGER之内时为`number`, 当数值超过时, 为`bignumber` (查看bignumber.js库 ( https://www.npmjs.com/package/bignumber.js ) |
| `TinyInt` | dataType.TinyInt(unsigned)   | |
| `SmallInt` | dataType.SmallInt(unsigned)   | |
| `Int` | dataType.Int(unsigned)   | |
| `Float` | dataType.Float(unsigned)   | |
| `Numeric` | dataType.Numeric(unsigned, precision, scale)   | |
| `Decimal` | dataType.Decimal(unsigned, precision, scale)   | |
| `Real` | dataType.Real(unsigned)   | |
| `DateTime` | dataType.DateTime()   | 对应js的`Date`类型;<br> 在数据库中, <br>对应mysql的`datetime`类型,<br>对应sqlserver的`smalldatetime`类型.<br> (YYYY-MM-DD hh:mm:ss) |
| `Binary` | dataType.Binary(length)   | 对应js的`Buffer`类型 |
| `VarBinary` | dataType.VarBinary(length)   | 对应js的`Buffer`类型 |

## name map

在定义数据表时, 可以对数据表名和字段名称进行映射, 隐藏真正的字段名称以便保证安全性.

在逻辑编写中使用有意义的名称, 而在数据库定义中使用无意义的名称来保证安全性.

```js
var tablebase     = require('febs-db').tablebase;
var dataType      = require('febs-db').dataType;

class TableDemo extends tablebase {
  constructor() {
    super(
      'Admin',  // table name.
      ['ID', 'IntCol'],     // primary keys.
      {         // cols.
        ID:       {type: dataType.BigInt(true), map:'col1', key: true}, // the auto-incrementing
        Name:     {type: dataType.Varchar(10),  map:'col2'},
        NumberCol:{type: dataType.Float(),      map:'col3'},
        IntCol:   {type: dataType.Int(false),   map:'col4'},
        BoolCol:  {type: dataType.Bit(),        map:'col5'}
      }
    );
  }
}

database.registerTable(new TableDemo(), 'realName');

```

# Connect db

```js
var database = require('febs-db').database;


// 使用如下的结构来构建数据库, 数据库将使用此信息进行连接.
var opt = {

  /**
   * timeout of connect to database.
   */
  connectTimeout    : 5000,
  /**
   * timeout of query.
   */
  queryTimeout      : 5000,
  /**
   * timeout of acquire connection from pool.
   */
  acquireTimeout    : 5000,
  /**
   * max queue length of wait for acquire connection.
   */
  queueLimit        : 200,
  /**
   * max count of connection in pool.
   */
  connectionLimit   : 10,
  /**
   * idle timeout to recreate connect.
   */
  idleTimeoutMillis : 600000,
  /**
   * database host.
   */
  host              : '',
  /**
   * databse port.
   */
  port              : 3306,
  /**
   * database name.
   */
  database          : '',
  /**
   * user name of databse.
   */
  user              : '',
  /**
   * the password of user.
   */
  password          : '',

  /**
   * [for mssql] encrypt the connect scheme. (Windows Azure)
   */
  encrypt           : true,

  /**
   * the prefix of table.
   */
  table_prefix      : '',
};

var db = new database(
               'mysql', // 数据库类型, 目前支持 'mysql', 'mssql'
                opt
              );
```

# Query db

- [add](#add)
- [remove](#remove)
- [update](#update)
- [count](#count)
- [exist](#exist)
- [select](#select)
- [selectLockRow](#selectlockrow)
- [store procedure](#store-procedure)
- [condition](#condition)

## add

直接使用数据对象添加
```js
let mod = {Name:'demo', IntCol:10};

table.add(mod)
.then((ret)=>{
  console.log(`Result of exec is: ${ret}`);
  // 如果存在自增键.将自动写入存储在mod中.
})
.catch(e=>{});
```

## remove

使用查询条件进行删除.

!! 查询条件可以使用 [condition](#condition) 进行构造, condition会对数据类型进行验证.
```js
// 构造sql.
var where = table.condition.equal('id', 1);
table.remove(where); // 删除id=1的数据.
.then((ret)=>{
  console.log(`Result of exec is: ${ret}`);
})
.catch(e=>{});
```

## update

- 更新方法需传入一个对象, 更新其中的非主键对应的值; 

- 如果参数中附带主键, 则主键将作为更新的查询条件之一;

- 如果不附带主键, 则执行条件where必须存在, 否则抛出异常.

```js
// 构造sql.
let mod = {
  ID:     1,      // primary key.
  name:   "name",
  intCol: table.condition.col_inc(1),   // 此字段自增1.
  intCol2:table.condition.col_origin_sql('`intCol2`+1')   // 执行原始sql, 不进行类型验证.
};

table.update(mod);  // ID=1,name="name",intCol=intCol+1,intCol2=intCol2+1
.then((ret)=>{
  console.log(`Result of exec is: ${ret}`);
})
.catch(e=>{});
```

## count

```js
let where = '';
where += table.condition.equal('id', 43); // `id`=43.
where += 'AND';
where += table.condition.like('name', '%123'); // `name` like '%123'.

table.count(where)
.then(count=>{
  console.log(`Result is ${count}`);
})
.catch(err=>{})
```

## exist

```js
table.exist(1)  // 判断id=1的数据是否存在.
.then(ret=>{
  console.log(`Result is ${ret}`);
})
.catch(err=>{})
```

## select

查询时如果不指定分页信息, 则默认查询100条.
```js

// make query conditon.
var where = '';
where += table.condition.equal('ID', 1);
where += 'AND';
where += table.condition.more_than('ID', 1);

// select.
// SELECT ID,Name FROM TableName WHERE [where]; and offset, limit.
table.select(where, {
  cols: ['ID','Name'],
  offset: 0,
  limit: 100
})
.then(ret=>{})
.catch(e=>{});

// query.
// SELECT COUNT(ID) as x,Name FROM TableName WHERE [where]; with <pagerInfo>.
table.select(where, {
  cols: ['COUNT(ID) as x','Name'],
  offset: 0,
  limit: 100
})
.then(ret=>{})
.catch(e=>{});
```

## selectLockRow

锁行方式查询, 只能在事务中使用此方式. 在事务结束或update之后自动解锁.

```js
table.selectLockRow(id, ['ID','Name'])
.then(ret=>{})
.catch(e=>{});
```

## store procedure

调用如下的存储过程.
```sql
# mysql procedure
CREATE PROCEDURE procedureName(out out1 int, out out2 int, in userid int)
BEGIN
  select count(id) INTO out1 from table1;
  select count(id) INTO out2 from table1 where id=userid;
  select out1, out2;
END
```
调用过程如下:
```js
var procedureParams = require('febs-db').procedureParams;
var dataType        = require('febs-db').dataType;

// make param.
var params = new procedureParams();
params.addOut('out1', dataType.Int());
params.addOut('out2', dataType.Int());
params.addIn('userid', dataType.Int(), 2);

// exec.
db.execProcedure('procedureName', params)
.then(ret=>{
  console.log('');
  console.log('[promise procedure]');
  console.log(ret.out.out1);
  console.log(ret.out.out2);
})
.catch(e=>{
  console.log(e);
})
```

## condition

构造`key=value`条件语句
```js
table.condition.equal('colName', value) // return sql string.
```

构造`key>value`条件语句
```js
table.condition.more_than('colName', value) // return sql string.
```

构造`key>=value`条件语句
```js
table.condition.more_equal('colName', value) // return sql string.
```

构造`key<=value`条件语句
```js
table.condition.less_equal('colName', value) // return sql string.
```

构造`key<value`条件语句
```js
table.condition.less_than('colName', value) // return sql string.
```

构造`key<>value`条件语句
```js
table.condition.not_equal('colName', value) // return sql string.
```

构造`key LIKE value`条件语句
```js
// 可对value添加%_通配符前,进行db.escapeLike(value),进行安全转义.
table.condition.like('colName', value) // return sql string.
```

构造`key BETWEEN value1 AND value2`条件语句
```js
table.condition.between('colName', value1, value2) // return sql string.
```

构造`key IN (value1,value2...)`条件语句
```js
table.condition.in('colName', valueArray) // return sql string.
```

构造`key NOT IN (value1,value2...)`条件语句
```js
table.condition.not_in('colName', valueArray) // return sql string.
```

复杂逻辑条件.
```js
let where = '';
where += table.condition.equal('colName', value);
where += 'AND';
where += table.condition.equal('colName2', value2);
```

在update中使用, 构造自增字段.
```js
let mod = {
  id:   1,
  col1: table.condition.col_inc(2)  // 相当于 col1 = col1+2
}
await table.update(mod);
```

在update中使用, 调用原始sql语句.
```js
let mod = {
  id:   1,
  col1: table.condition.col_origin_sql('table2.col2+col1')  // 相当于 col1 = table2.col2+col1
}
await table.update(mod);
```


# transaction

* 执行事务系统将创建一个独立的连接, 事务完成后连接对象将重新被插入到连接池中. 在嵌套的事务中, 不会重新创建连接.
* 事务处理函数中, 返回`false`或发生`异常` 将`rollback`, 返回`true`将`commit`
* 允许事务嵌套调用.
* 仅支持行级锁, 不支持表级锁.

## isolation level

事务隔离级别在 `isolationLevel` 类中定义; 

事务默认提供`共享锁`, 需要获得`排他锁`使用 `selectLockRow`

```js
var isolationLevel = require('febs-db').isolationLevel;

/**
* @desc: 允许事务读取另外一个事务中未commit的数据. (脏读)
*/
isolationLevel.Read_uncommitted;
/**
* @desc: 一个事务读取数据,另外一个事务也可以读取数据并且进行更新提交. (不可重复读)
*/
isolationLevel.Read_committed;
/**
* @desc: 不同事务互相不影响, 即使其中一个事务修改了数据并提交, 另一个事务还是查询到原来的数据. (幻读)
*/
isolationLevel.Repeatable_read;
/**
* @desc: 一个事务进行数据查询后, 并且在事务提交之前, 其他事务不允许修改此数据.
*        查询操作就将锁住数据, 避免其他事务修改. 但读共享.
*/
isolationLevel.Serializable;
```

|   |  脏读 |  不可重复读  |  幻读  |
|---|------|-------------|--------|
| Read_uncommitted | √ | √ | √ |
| Read_committed | ×  | √ | √ |
| Repeatable_read | × | × | √ |
| Serializable | × | × | × |



```js
//
// 开启sql日志. global.dbagent 是预先存储的全局数据库对象
global.dbagent.sqlLogCallback = function(err, sql) {
  console.log(
`
${febs.utils.getTimeString(Date.now(), 'yyyy-MM-dd hh:mm:ss')}
SQL: ${sql}
ERR: ${err}
`);
}

//
// 开启一个事务.
global.dbagent.transaction(
  isolationLevel.Repeatable_read, // 使用可重读隔离级别.
  async function(db){
    // !!![在此事务中sql相关方法只能使用db, 使用其他数据库对象将引起错误.]

    // db是一个global.dbagent的副本. 克隆了全部的global.dbagent方法, 可以直接调用.

    // 执行sql方法 or 嵌套执行其他事务.

    /**
    * 返回true则事务自动提交, 返回false或者异常则rollback.
    */
    return true; 
  })
  .then(res=>{
    // res表明事务是否成功提交.
    if (res)
      console.log(`the transaction is committed`);
    else
      console.log(`the transaction is rollback`);
  })
  .catch(err=>{  });
```

# Class database API

- [constructor](#constructor)
- [registerTable](#registertable)
- [exec](#exec)
- [execProcedure](#execProcedure)
- [transaction](#transaction)
- [dbType](#dbtype)
- [sqlLogCallback](#sqllogcallback)
- [escapeLike](#escapeLike)
- [type_cast](#typecast)

## constructor

```js
/*
* 构造
*/
constructor(dbtype, opt)
```
* dbtype: 数据库类型, 目前仅支持 `'mysql'`, `'mssql'`
* opt: 连接参数
```js
// 使用如下的结构来构建数据库, 数据库将使用此信息进行连接.
var opt = {

  /**
   * timeout of connect to database.
   */
  connectTimeout    : 5000,
  /**
   * timeout of query.
   */
  queryTimeout      : 5000,
  /**
   * timeout of acquire connection from pool.
   */
  acquireTimeout    : 5000,
  /**
   * max queue length of wait for acquire connection.
   */
  queueLimit        : 200,
  /**
   * max count of connection in pool.
   */
  connectionLimit   : 10,
  /**
   * database host.
   */
  host              : '',
  /**
   * databse port.
   */
  port              : 3306,
  /**
   * database name.
   */
  database          : '',
  /**
   * user name of databse.
   */
  user              : '',
  /**
   * the password of user.
   */
  password          : '',
  /**
   * the prefix of all tables.
   */
  table_prefix      : '',
};
```

## registerTable
```js
/**
* @desc: 注册表格到此数据库.
* @param mapName: 映射数据中真实的表名.
*/
registerTable(table, mapName=null)
```

## exec
```js
/**
* @desc: 执行sql语句.
* @return: Promise.
* @resolve:
*     ret - 查询结果.
*       {
          rowsAffected,  // 受影响的行数.
          rows,          // 返回的数据数组.
          insertId,      // 自增键的值.
        }
*/
exec(sql)
```

## execProcedure
```js
/**
* @desc: 执行存储过程.
* @param name: procedure name.
* @param procedureParams: in,out参数; 使用 procedureParams对象.
* @return: Promise.
* @resolve:
*     ret - 查询结果,out参数存储至其中.
*       {
          rowsAffected,  // 受影响的行数.
          rows,          // 返回的数据数组.
          insertId,      // 自增键的值.
          out,           // 输出结果的参数集合.
        }
*/
execProcedure(name, procedureParams)
```

## transaction
```js
/**
* @desc: 创建一个事务.
* @param isolationLevel: 事务级别. 使用了数据库不支持的隔离级别将reject (例如oracle中不支持READ UNCOMMITTED)
* @param taskCB: async function(db):boolean {}; 返回false则rollback, 返回true则commit.
* @return: Promise.
* @resolve:
*     ret - 是否成功提交.
*/
transaction(isolationLevel, taskCB)
```

## dbType
```js
/**
* @desc: 数据库类型.
* @return: 'mysql' / 'mssql'.
*/
get dbtype()
```

## sqlLogCallback
```js
/**
* @desc: 设置执行sql的log回调. 每次执行数据库查询都将调用此方法.
* @param cb: function(err, sql) {}
*/
set sqlLogCallback(cb)
get sqlLogCallback()
```

## escapeLike
```js
  /**
  * @desc: 对likeSql进行转义操作.
  *         如mssql中, like字符为 'abc%a', 其中%需转义为 [%]
  * @return: string.
  */
  escapeLike(likeSql)
```

## type_cast
```js
/**
  * @desc: type cast, 为指定类型和值返回正确的sql值.
  * @return: 传入不配对的value与type,可引发异常. 返回sql.
  */
  type_cast(type, value)
```


# Class tablebase API

- [constructor](#constructor-1)
- [add](#add-1)
- [remove](#remove-1)
- [update](#update-1)
- [selectLockRow](#selectlockrow-1)
- [select](#select-1)
- [count](#count-1)
- [exist](#exist-1)
- [tablename](#tablename)
- [condition](#condition-1)
- [getLogicColName](#getLogicColName)
- [db](#db)

### constructor
```js
/**
* @desc 构造数据表.
* @param idKeyName: 主键. 单主键时为主键名, 多主键时为主键名数组.
* @param tablename: 本表名.
* @param model: 本表模型.
*/
constructor(tablename, idKeyName, model)
```

`model`的定义格式如下:

> {<br>
    colName: {`type`: dataType.BigInt(10), `map`: '', `key`: true}, // the auto-incrementing<br>
    ...<br>
  }

- `colName`: 表示列名称
- `type`: 表示列类型, 查看 [column data type](#column-data-type)
- `map`:  映射数据库中真实的字段名称. 如果不指定则使用`colName`
- `key`:  是否是自增键; (同一个表只能有一个自增键, 当指定多个自增键时, 只认为最后一个为自增)


### add

```js
  /**
  * @desc: add
  *         (insertId will set to item.id)
  * @param item: 要添加的数据对象.
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  add( item )
```

### remove

```js
  /**
  * @desc: remove; 删除条件必须存在.
  * @return: Promise.
  * @resolve:
  *   ret - boolean. 是否成功删除.
  */
  remove( where )
```

### update

```js
  /**
  * @desc: update data.
  *         if item.id is existed, sql condition is: 'id=value' AND (where)
  *         otherwise sql condition is: where 
  * @param item: 要更新的数据. 使用其中的主键值做为查询条件之一
  * @param where: 查询条件, 如果item中不存在主键, 则查询条件必须存在.
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  update( item, where = null )
```

### selectLockRow

```js
  /**
  * @desc: select by id and lock row for update (use in transaction).
  *        
  * @param id: 主鍵值. 如果表定义为复合主键, 则id为object, 例如: {ID1:1, ID2:2}. 单住进直接为主键值.
  * @param cols:
  *           需要查询出的字段名称数组, 例如:['col1', 'col2', ...].
  * @return: Promise.
  * @resolve:
  *   ret - mod.
  */
  selectLockRow( id, cols = null )
```

### select

```js
  /**
  * @desc: select.
  *         sql的连接顺序为: SELECT cols FROM table where groupSql orderby pageInfo.
  *
  * @param where:
  *           查询条件,不会对此字符串验证. 使用 condition 对象进行构建.
  * @param opt: 查询选项. 可以包含以下键值.
  *         - cols:  需要查询出的字段名称数组; 例如: [col1, col2, ...]; 不指定则为查询全部.
  *         - groupSql:   group by子句, 不会对内容进行验证; 应包含group by关键字.
  *         - orderby:    orderby by子句, 例如: {key:true/false} true-means asc, false-means desc..
  *         - offset:     分页查询起始位置.
  *         - limit:      分页查询查询行数.
  * @return: Promise.
  * @resolve:
  *   ret - mod array.
  */
  select( where, opt = null )
```

### count

```js
  /**
  * @desc: count
  * @param: where
  * @return: Promise.
  * @resolve:
  *   ret - number.
  */
  count(where = null)
```

### exist

```js
  /**
  * @desc: exist
  *         id is Object if table is combined primary. 
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  exist(id)
```

### tablename

```js
/**
  * @desc: 表名称.
  * @return: string.
  */
  get tablename()
```

### condition

```js
  /**
  * @desc: 条件构造对象，使用此对象可以在类型安全的情况下构造查询条件.
  * @return: 
  */
  get condition()
```

```js
/**
  * @desc: 使用字段的映射名称获得字段的逻辑名称.
  * @return: string; 找不到返回undefined.
  */
  getLogicColName(mapName)
```

### db

```js
  /**
  * @desc: 所属数据库.
  * @return: 
  */
  get db()
```

# Class condition API

- [equal](#equal)
- [more_than](#more_than)
- [more_equal](#more_equal)
- [less_equal](#less_equal)
- [less_than](#less_than)
- [not_equal](#not_equal)
- [like](#like)
- [between](#between)
- [in](#in)
- [not_in](#not_in)
- [col_inc](#col_inc)
- [col_origin_sql](#col_origin_sql)

### equal

```js
  /**
  * @desc: 构造一个 key=value的sql条件语句.
  * @return: sql;
  */
  equal( key, value ) 
```

### more_than

```js
  /**
  * @desc: 构造一个 key>value的sql条件语句.
  * @return: sql;
  */
  more_than( key, value )
```

### more_equal

```js
  /**
  * @desc: 构造一个 key>=value的sql条件语句.
  * @return: sql;
  */
  more_equal( key, value )
```

### less_equal

```js
  /**
  * @desc: 构造一个 key<=value的sql条件语句.
  * @return: sql;
  */
  less_equal( key, value )
```

### less_than

```js
  /**
  * @desc: 构造一个 key<value的sql条件语句.
  * @return: sql;
  */
  less_than( key, value )
```

### not_equal

```js
  /**
  * @desc: 构造一个 key<>value的sql条件语句.
  * @return: sql;
  */
  not_equal( key, value ) 
```

### like

```js
  /**
  * @desc: 构造一个 key LIKE value的sql条件语句.
  *     不对value值进行反义操作.
  * @return: sql;
  */
  like( key, value )
```

### between

```js
  /**
  * @desc: 构造一个 key BETWEEN value1 AND value2的sql条件语句
  * @return: sql;
  */
  between( key, value1, value2 )
```

### in

```js
  /**
  * @desc: 构造一个 key IN (value1, value2, ...) 的sql条件语句
  * @return: sql;
  */
  in( key, valueArray )
```

### not_in

```js
  /**
  * @desc: 构造一个 key NOT IN (value1, value2, ...) 的sql条件语句
  * @return: sql;
  */
  not_in( key, valueArray )
```

### col_inc

```js
  /**
  * @desc: 在update中使用, 用于表明sql中字段自增n.
  * @example: col=col+n
  */
  col_inc(n)
```

### col_origin_sql

```js
  /**
  * @desc: 在update中使用, 用于表明 col=v, 将不对v进行任何检验.(也不在v字符串两边加'符号)
  */
  col_origin_sql(v)
```


# Class dataType API

- [getType](#gettype)
- [isIntegerType](#isintegertype)
- [isStringType](#isstringtype)
- [getValueBigInt](#getValueBigInt)
- [getValueBit](#getValueBit)

### getType

```js
  /**
  * @desc: 获得参数的类型.(不考虑长度等其他选项)
  */
  getType   (value)
```

### isIntegerType

```js
  /**
  * @desc: 判断类型是否为整型. 
  */
  isIntegerType (value) 
```

### isStringType

```js
  /**
  * @desc: 判断类型是否为字符串. 
  */
  isStringType (value)
```

## getValueBigInt

```js
  /**
   * 将sql类型的bigint值转换成nodejs值, 大于13位的数值将使用bignumber, 否者使用number.
   * @param {*} sqlValue 数据库bigint值.
   */
  getValueBigInt(sqlValue)
```

## getValueBit

```js
  /**
   * 将sql类型的bit值转换成nodejs值
   * @param {*} sqlValue 数据库bit值.
   */
  getValueBit(sqlValue)
```