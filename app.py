from flask import Flask, render_template, url_for, request, jsonify
from markupsafe import Markup
from dotenv import load_dotenv
import os
import mysql.connector
import re
import atexit

app = Flask(__name__) 

def execute_sql(sql,commit_flag):
    cursor = dbaccess.cursor()
    try:
        cursor.execute(sql)
        if commit_flag:
            dbaccess.commit()
        return ("Success", cursor)
    except mysql.connector.Error as err:
        return ("Failed: " + str(err) + " STATE: " + str(err.sqlstate), cursor)

def fetch_table_list(db):
    sql = "USE " + db
    result, cursor = execute_sql(sql,False)
    tblistF = None
    if result == "Success":
        sql = "SHOW TABLES"
        result, cursor  = execute_sql(sql,False)
        if result == "Success":
            tblist  = cursor.fetchall()
            tblistF = [tb[0] for tb in tblist]
    return (tblistF, result)

def fetch_table_data(db,tb):
    sql = "USE " + db
    result, cursor = execute_sql(sql,False)
    table_items = None
    colmn_names = None
    items_count = 0
    if result == "Success":
        sql = "SELECT * FROM " + tb
        result, cursor = execute_sql(sql,False)
        if result == "Success":
            table_items = cursor.fetchall()
            colmn_names = [column[0] for column in cursor.description]
            items_count = len(table_items)
    return (table_items, colmn_names, items_count, result)

def update_table_data(db,tb,cols,vals,prevvals):
    sql = "USE " + db
    result, cursor = execute_sql(sql,False)
    if result == "Success":
        sql = "UPDATE " + tb + " SET "
        i = 0
        for j in range(len(cols)):
            sql += cols[j]+'='+'"'+vals[i]+'"'
            if (j + 1 != len(cols)):
                sql += ','
            i = i + 1
        sql += " WHERE "
        i = 0
        for j in range(len(cols)):
            sql += cols[j]+'='+'"'+prevvals[i]+'"'
            if (j + 1 != len(cols)):
                sql += ' AND '
            i = i + 1
        sql += ';'
        result, cursor = execute_sql(sql,True)
    return result
    
def delete_table_row(db,tb,cols,vals):
    sql = "USE " + db
    result, cursor = execute_sql(sql,False)
    if (result == "Success"):
        sql = "DELETE FROM " + tb + " WHERE "
        j = 0
        for c in cols:
            sql += c+'='+'"'+vals[j]+'"'
            if (j + 1 != len(cols)):
                sql += ' AND '
            j = j + 1
        sql += ';'
        result, cursor = execute_sql(sql,True)
    return result

@app.route("/")
def home():
    return render_template("index.html", dblist=dblistFiltered, tablelist=tblistFiltered)

@app.route("/updatetablelist", methods=['POST'])
def updateDisplayTables():
    db = request.form['db']
    ls, res = fetch_table_list(db)
    options = ""
    if res == "Success":
        for table in ls:
            options += Markup("<option value=" +'"'+ table +'"' +">" + table + "</option>")
    else:
        options += Markup("<option value=" +'"'+ res +'"' +">" + res + "</option>")
    return options

@app.route("/gettabledata", methods=['POST'])
def displayTable():
    db = request.form['db']
    tb = request.form['tb']
    table_items, column_names, table_length,result = fetch_table_data(db,tb)
    response = jsonify(
        table_data = table_items,
        column_names = column_names,
        table_length = table_length,
        query_result = result
    )
    return response

@app.route("/updatetablerow", methods=['POST'])
def updateRowRoute():
    data = request.get_json()
    db = data['db']
    tb = data['tb']
    cl = data['columns']
    vl = data['values']
    vp = data['cached_values']
    result = update_table_data(db,tb,cl,vl,vp)
    return jsonify(
        query_result = result
    )

@app.route("/deleterow",methods=['POST'])
def deleteRowRoute():
    data = request.get_json()
    db = data['db']
    tb = data['tb']
    cl = data['columns']
    vl = data['values']
    result = delete_table_row(db,tb,cl,vl)
    return jsonify(
        query_result = result
    )

def exit_handler():
    dbaccess.close()

# if module is being run __name__ is set to "__main__"
# otherwise it is set to the module name and is being imported by other program
if __name__ == "__main__": 
    # env file hides away keys that may be security vulnerabilities
    load_dotenv() # this call searches for the environment variable file

    dbaccess = mysql.connector.connect(
        host=os.getenv('HOST'),
        user=os.getenv('USER'),
        password=os.getenv('PASS')
    )

    # fetch the set of db currently available
    sql = "SHOW DATABASES" 
    result, cursor = execute_sql(sql,False) # initially returns amount of dbs that exist
    dblist = cursor.fetchall()              # this call gets you the array of db names, in tuples
    dblistFiltered = [db[0] for db in dblist] # fetches first item in each tuple, which holds db name for this query

    # fetch set of tables for the db that is displayed on page load
    tblistFiltered, result = fetch_table_list(dblistFiltered[0])
    atexit.register(exit_handler)
    app.run()