from sqlalchemy import create_engine

engine = create_engine("sqlite:///segmenta.db")

conn = engine.connect()

q = """
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL,
    description TEXT
);
"""

q1 = """
create table images (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    project_id INTEGER, 
    image_name TEXT NOT NULL, 
    image_type text, 
    image_size integer, 
    last_modified_date Datetime, 
    src TEXT
);
"""

q2 = """
create table project_masks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT, 
    project_id  INTEGER, 
    class_name  TEXT NOT NULL, 
    class_color TEXT NOT NULL,
    description TEXT
);
"""


conn.execute(q)    
