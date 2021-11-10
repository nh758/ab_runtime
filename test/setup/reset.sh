rm ./drop_all_tables.sql

## gotta ignore foreigh key checks
echo "SET FOREIGN_KEY_CHECKS = 0;" > ./drop_all_tables.sql

## PUll all our tables out of the dump:
( mysqldump --add-drop-table --no-data -u root -p[dbPassword] "appbuilder-admin" | grep 'DROP TABLE' ) >> ./drop_all_tables.sql

## Remove all our remaining Views as well:
echo \
"SET @views = NULL; 
SELECT GROUP_CONCAT('\`',table_schema, '\`.', table_name) INTO @views \
 FROM information_schema.views  \
 WHERE table_schema = \"appbuilder-admin\"; \
\
SET @views = IFNULL(CONCAT('DROP VIEW ', @views), 'SELECT \"No Views\"'); \
PREPARE stmt FROM @views; \
EXECUTE stmt; \
DEALLOCATE PREPARE stmt; " \
>> ./drop_all_tables.sql

## Now turn back on foreign key checks
echo "SET FOREIGN_KEY_CHECKS = 1;" >> ./drop_all_tables.sql

mysql -u root -p[dbPassword] "appbuilder-admin" < ./drop_all_tables.sql
mysql -u root -p[dbPassword] "appbuilder-admin" < ./sql/reset.sql
mysql -u root -p[dbPassword] "appbuilder-admin" < ./sql/reset_tenant.sql