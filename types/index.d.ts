// Type definitions for febs

/// <reference types="node" />
/// <reference types="febs" />

declare namespace febsdb {
  
    export interface execRet {
      rowsAffected: number,  // 受影响的行数.
      rows: Array<any>,          // 返回的数据数组.
      insertId?: number | object,      // 自增键的值.
      out?: any,   // 输出结果.
    }
  
    export namespace dataType {
  
      /**
      * @desc: 获得参数的类型.(不考虑长度等其他选项)
      */
      function getType(value: any): any;
  
      /**
      * @desc: 判断类型是否为整型. 
      */
      function isIntegerType(value: any): boolean;
  
      /**
      * @desc: 判断类型是否为字符串. 
      */
      function isStringType(value: any): boolean;
  
      /**
       * 将sql类型的bigint值转换成nodejs值, 大于13位的数值将使用bignumber, 否者使用number.
       * @param {*} sqlValue 数据库bigint值.
       */
      function getValueBigInt(sqlValue: any): number | object;
  
      /**
       * 将sql类型的bit值转换成nodejs值
       * @param {*} sqlValue 数据库bit值.
       */
      function getValueBit(sqlValue: any): boolean;
  
      /**
      * @desc: use string. 
      */
      function VarChar(length?: number): any;
      function NVarChar(length?: number): any;
      function Text(): any;
      function NText(): any;
      function Char(length?: number): any;
      function NChar(length?: number): any;
  
      /**
      * @desc: use boolean. 
      */
      function Bit(): any;
  
      /**
      * @desc:  use number or BigNumber (BigNumber.js)
      */
      function BigInt(unsigned?: boolean): any;
  
      /**
      * @desc: use number. 
      */
      function TinyInt(unsigned?: boolean): any;
      function SmallInt(unsigned?: boolean): any;
      function Int(unsigned?: boolean): any;
      function Float(unsigned?: boolean): any;
      function Numeric(unsigned?: boolean, precision?: number, scale?: number): any;
      function Decimal(unsigned?: boolean, precision?: number, scale?: number): any;
      function Real(unsigned?: boolean): any;
  
      /**
      * @desc: use Date.
      *   mssql:   smalldatetime  (YYYY-MM-DD hh:mm:ss)
      *   mysql:   datetime       (YYYY-MM-DD hh:mm:ss)
      */
      function DateTime(): any;
  
      /**
      * @desc: use Buffer. 
      */
      function Binary(length?: number): any;
      function VarBinary(length?: number): any;
    }
  
    export class procedureParams {
  
      constructor();
  
      /**
      * @desc: 添加in参数.
      * @param type: type为dataType.xxx()
      * @return: 
      */
      addIn(name: string, type: any, value: any): void;
  
      /**
      * @desc: 添加out参数.
      * @param type: type为dataType.xxx()
      * @return: 
      */
      addOut(name: string, type: any): void;
    }
  
    export namespace isolationLevel {
      /**
      * @desc: 允许事务读取另外一个事务中未commit的数据. (脏读)
      */
      const Read_uncommitted: 'read_uncommitted';
      /**
      * @desc: 一个事务读取数据,另外一个事务也可以读取此数据并且进行更新提交. (不可重复读)
      */
      const Read_committed: 'read_committed';
      /**
      * @desc: 不同事务互相不影响, 即使其中一个事务修改了数据并提交, 另一个事务还是查询到原来的数据. (幻读)
      */
      const Repeatable_read: 'repeatable_read';
      /**
      * @desc: 一个事务进行数据查询后, 并且在事务提交之前, 其他事务不允许修改此数据.
      *        查询操作就将锁住数据, 避免其他事务修改. 但读共享.
      */
      const Serializable: 'serializable';
    }
  
    //
    // database.
  
    namespace database {
      export interface opt {
        /**
         * timeout of connect to database.
         */
        connectTimeout?: number;
        /**
         * timeout of query.
         */
        queryTimeout?: number;
        /**
         * timeout of acquire connection from pool.
         */
        acquireTimeout?: number;
        /**
         * max queue length of wait for acquire connection.
         */
        queueLimit?: number;
        /**
         * max count of connection in pool.
         */
        connectionLimit?: number;
        /**
         * database host.
         */
        host?: string;
        /**
         * databse port.
         */
        port?: number;
        /**
         * database name.
         */
        database?: string;
        /**
         * user name of databse.
         */
        user?: string;
        /**
         * the password of user.
         */
        password?: string;
        /**
         * the prefix of all tables.
         */
        table_prefix?: string;
      }
    }
  
    export class database {
      /**
       * @desc: 进行ajax请求, 同 febs.nav.ajax.
       */
      constructor(dbtype: 'mysql' | 'mssql', opt: database.opt);
      /**
      * @desc: 注册表格到此数据库.
      * @param mapName: 映射数据中真实的表名.
      */
      registerTable(table: string, mapName?: string): void;
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
      exec(sql: string): Promise<execRet>;
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
      execProcedure(name: string, procedureParams: procedureParams): Promise<execRet>;
  
      /**
      * @desc: 创建一个事务.
      * @param isolationLevel: 事务级别. 使用了数据库不支持的隔离级别将reject (例如oracle中不支持READ UNCOMMITTED)
      * @param taskCB: async function(db):boolean {}; 返回false则rollback, 返回true则commit.
      * @return: Promise.
      * @resolve:
      *     ret - 是否成功提交.
      */
      transaction(isolationLevel: string, taskCB: (db: database) => boolean): Promise<boolean>;
  
      /**
      * @desc: 数据库类型.
      * @return: 'mysql' / 'mssql'.
      */
      dbtype: 'mysql' | 'mssql';
  
      /**
      * @desc: 设置执行sql的log回调. 每次执行数据库查询都将调用此方法.
      * @param cb: function(err, sql) {} 
      */
      sqlLogCallback: (err: any, sql: string) => void;
  
      /**
      * @desc: 对likeSql进行转义操作.
      *         如mssql中, like字符为 'abc%a', 其中%需转义为 [%]
      * @return: string.
      */
      escapeLike(likeSql: string): string;
      /**
      * @desc: type cast, 为指定类型和值返回正确的sql值.
      * @return: 传入不配对的value与type,可引发异常. 返回sql.
      */
      type_cast(type: any, value: any): string;
    }
  
    export class tablebase {
      /**
      * @desc 构造数据表.
      * @param idKeyName: 主键. 单主键时为主键名, 多主键时为主键名数组.
      * @param tablename: 本表名.
      * @param model: 本表模型.
      */
      constructor(tablename: string, idKeyName: string | Array<string>, model: Array<any>);
  
      /**
      * @desc: add
      *         (insertId will set to item.id)
      * @param item: 要添加的数据对象.
      * @return: Promise.
      * @resolve:
      *   ret - boolean.
      */
      add(item: any): Promise<boolean>;
  
      /**
      * @desc: remove; 删除条件必须存在.
      * @return: Promise.
      * @resolve:
      *   ret - boolean. 是否成功删除.
      */
      remove(where: string): Promise<boolean>;
  
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
      update(item: any, where?: string): Promise<boolean>;
  
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
      selectLockRow(id: any, cols?: Array<string>): Promise<any>;
  
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
      select(where: string, opt?: tablebase.select_opt): Promise<Array<any>>;
  
      /**
      * @desc: count
      * @param: where
      * @return: Promise.
      * @resolve:
      *   ret - number.
      */
      count(where?: string): Promise<number>;
  
      /**
      * @desc: exist
      *         id is Object if table is combined primary. 
      * @return: Promise.
      * @resolve:
      *   ret - boolean.
      */
      exist(id: any): Promise<boolean>;
  
      /**
      * @desc: 表名称.
      * @return: string.
      */
      tablename: string;
  
      /**
      * @desc: 条件构造对象，使用此对象可以在类型安全的情况下构造查询条件.
      * @return: 
      */
      condition: condition;
  
      /**
      * @desc: 使用字段的映射名称获得字段的逻辑名称.
      * @return: string; 找不到返回undefined.
      */
      getLogicColName(mapName: string): string | undefined;
  
      /**
      * @desc: 所属数据库.
      * @return: 
      */
      db: database;
    }
  
  
    namespace tablebase {
      export interface select_opt {
        /** 需要查询出的字段名称数组, 例如: [col1, col2, ...]; 不指定则为查询全部. */
        cols?: Array<string>;
        /** group by子句, 不会对内容进行验证; 应包含group by关键字. */
        groupSql?: string;
        /** orderby by子句, 例如: {key:true/false} true-means asc, false-means desc.. */
        orderby?: object;
        /** 分页查询起始位置. */
        offset?: number;
        /** 分页查询查询行数. */
        limit?: number;
      }
    }
  
    export class condition {
      /**
      * @desc: 构造一个 key=value的sql条件语句.
      * @return: sql;
      */
      equal(key: string, value: any): string;
      /**
      * @desc: 构造一个 key>value的sql条件语句.
      * @return: sql;
      */
      more_than(key: string, value: any): string;
      /**
      * @desc: 构造一个 key>=value的sql条件语句.
      * @return: sql;
      */
      more_equal(key: string, value: any): string;
      /**
      * @desc: 构造一个 key<=value的sql条件语句.
      * @return: sql;
      */
      less_equal(key: string, value: any): string;
      /**
      * @desc: 构造一个 key<value的sql条件语句.
      * @return: sql;
      */
      less_than(key: string, value: any): string;
      /**
      * @desc: 构造一个 key<>value的sql条件语句.
      * @return: sql;
      */
      not_equal(key: string, value: any): string;
      /**
      * @desc: 构造一个 key LIKE value的sql条件语句.
      *     不对value值进行反义操作.
      * @return: sql;
      */
      like(key: string, value: any): string;
      /**
      * @desc: 构造一个 key BETWEEN value1 AND value2的sql条件语句
      * @return: sql;
      */
      between(key: string, value1: any, value2: any): string;
      /**
      * @desc: 构造一个 key IN (value1, value2, ...) 的sql条件语句
      * @return: sql;
      */
      in(key: string, valueArray: Array<any>): string;
      /**
      * @desc: 构造一个 key NOT IN (value1, value2, ...) 的sql条件语句
      * @return: sql;
      */
      not_in(key: string, valueArray: Array<any>): string;
      /**
      * @desc: 在update中使用, 用于表明sql中字段自增n.
      * @example: col=col+n
      */
      col_inc(n: number): any;
      /**
      * @desc: 在update中使用, 用于表明 col=v, 将不对v进行任何检验.(也不在v字符串两边加'符号)
      */
      col_origin_sql(v: string): any;
    }
  
  
    //
    // exception.
    export class exception {
      constructor(msg: string, code: string, filename: string, line: number);
  
      /** @desc: 错误代码 */
      code: string;
      /** @desc: 错误消息 */
      msg: string;
      /** @desc: 错误文件 */
      filename: string;
      /** @desc: 错误所在行 */
      line: string;
    }
  
    export namespace exception {
  
      /** @desc: 通用错误. */
      const DB_CommonException: string;
      /** @desc: 数据查询条件错误。sql语句问题.. */
      const DB_SqlException: string;
      /** @desc: 数据库连接问题 */
      const DB_ConnectException: string;
      /** @desc: 数据库查询时产生的问题, 可能是数据库服务器问题, 或是并发产生的事务锁问题等. */
      const DB_QueryException: string;
    }
  
  }
  
  export default febsdb;