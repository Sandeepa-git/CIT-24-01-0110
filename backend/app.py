from flask import Flask, request, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from pymongo import MongoClient
from bson import ObjectId
import datetime

app = Flask(__name__)
# Allow CORS for all origins, methods, and headers
CORS(app, resources={r"/*": {"origins": "*"}})

client = MongoClient("mongodb://mongodb:27017/")
db = client.notesdb
notes = db.notes

def serialize_note(note):
    return {
        "id": str(note["_id"]),
        "title": note.get("title", ""),
        "text": note.get("text", ""),  # Backward compatibility
        "content": note.get("content", ""),
        "color": note.get("color", "default"),
        "pinned": note.get("pinned", False),
        "tags": note.get("tags", []),
        "createdAt": note.get("createdAt", datetime.datetime.utcnow().isoformat())
    }

@app.route('/notes', methods=['GET'])
def get_notes():
    try:
        all_notes = []
        # Sort by pinned (descending), then by createdAt (descending)
        for note in notes.find().sort([("pinned", -1), ("createdAt", -1)]):
            all_notes.append(serialize_note(note))
        return jsonify(all_notes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notes', methods=['POST'])
def add_note():
    try:
        data = request.json or {}
        title = data.get("title", "").strip()
        content = data.get("content", "").strip()
        text = data.get("text", content).strip()  # Fallback for text field
        color = data.get("color", "default")
        pinned = data.get("pinned", False)
        tags = data.get("tags", [])
        
        if not title and not content and not text:
            return jsonify({"error": "Note title or content cannot be empty"}), 400
            
        new_note = {
            "title": title,
            "content": content,
            "text": text,
            "color": color,
            "pinned": pinned,
            "tags": tags,
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        
        result = notes.insert_one(new_note)
        new_note["_id"] = result.inserted_id
        return jsonify(serialize_note(new_note)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notes/<note_id>', methods=['PUT'])
def update_note(note_id):
    try:
        data = request.json or {}
        update_fields = {}
        
        if "title" in data:
            update_fields["title"] = data["title"].strip()
        if "content" in data:
            update_fields["content"] = data["content"].strip()
            update_fields["text"] = data["content"].strip()
        elif "text" in data:
            update_fields["text"] = data["text"].strip()
            update_fields["content"] = data["text"].strip()
        if "color" in data:
            update_fields["color"] = data["color"]
        if "pinned" in data:
            update_fields["pinned"] = bool(data["pinned"])
        if "tags" in data:
            update_fields["tags"] = data["tags"]
            
        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400
            
        result = notes.update_one({"_id": ObjectId(note_id)}, {"$set": update_fields})
        if result.matched_count == 0:
            return jsonify({"error": "Note not found"}), 404
            
        updated_note = notes.find_one({"_id": ObjectId(note_id)})
        return jsonify(serialize_note(updated_note)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notes/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    try:
        result = notes.delete_one({"_id": ObjectId(note_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Note not found"}), 404
        return jsonify({"message": "Note deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)