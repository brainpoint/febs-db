
0.0.3 / 2017-4-25
==================
  - Add database_table_base.getConnection().
  - Add database.query.

1.0.0 / 2017-6-5
==================
  - 修改为promise模式.
  - 修改架构, 不再兼容之前的版本
  - 添加数据类型
  - 添加事务隔离级别
  - 添加事务嵌套调用功能
  - 添加存储过程调用
  - 添加mssql支持
  - 添加sql日志管理

1.1.3 / 2017-6-16
==================
  - 获取bigint时, 当数值超过千亿时使用bignumber.

1.1.4 / 2017-6-26
==================
  - 添加字段及表名映射
  - 添加数据表前缀

1.1.5 / 2017-7-10
==================
  - 完善日志
  - fix less_then -> less_than

1.1.13 / 2017-7-24
==================
  - [bugfix]condition like 查询中文

1.1.15
==================
  - [bugfix] Datetime 类型数据使用utc时间格式存储至数据库

1.1.16
==================
  - [enhancement] type_cast日志增强

1.1.17
==================
  - [bugfix] selectLockRow返回单个对象.

1.1.18
==================
  - [bugfix] Datetime utc时间获取转换问题.

1.1.30
==================
  - [enhancement] 修改为非 construction方式导出.

1.1.32
==================
  - [enhancement] delete key 'RowNumber' in result.
  - [bugfix] connectPool problem.

1.3.10
==================
  - [enhancement] 增加registerTable返回值.

1.4.0
==================
  - [feature] 数值型字段允许使用string

1.5.0
==================
  - [feature] add NULL value type
