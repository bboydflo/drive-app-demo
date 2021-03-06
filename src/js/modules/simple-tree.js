// see tree implementation here: https://code.tutsplus.com/articles/data-structures-with-javascript-tree--cms-23393

function Queue() {
  this._oldestIndex = 1;
  this._newestIndex = 1;
  this._storage = {};
}

Queue.prototype.size = function () {
  return this._newestIndex - this._oldestIndex;
};

Queue.prototype.enqueue = function (data) {
  this._storage[this._newestIndex] = data;
  this._newestIndex++;
};

Queue.prototype.dequeue = function () {
  var oldestIndex = this._oldestIndex;
  var newestIndex = this._newestIndex;
  var deletedData;

  if (oldestIndex !== newestIndex) {
    deletedData = this._storage[oldestIndex];
    delete this._storage[oldestIndex];
    this._oldestIndex++;

    return deletedData;
  }
};

/**
 * data = {
 *   id [string]
 * }
 * @param {object} data
 */
function Node (data) {
  this.data = data;
  this.parent = null;
  this.children = [];
}

export default function Tree (data) {
  var node = new Node(data);
  this._root = node;
}

// this method traverses a tree with depth-first search
Tree.prototype.traverseDF = function (callback) {

  // this is a recurse and immediately-invoking function
  (function recurse(currentNode) {
    // step 2
    for (var i = 0, length = currentNode.children.length; i < length; i++) {
      // step 3
      recurse(currentNode.children[i]);
    }

    // step 4
    callback(currentNode);

    // step 1
  })(this._root);
};

Tree.prototype.traverseBF = function (callback) {
  var queue = new Queue();

  queue.enqueue(this._root);

  var currentTree = queue.dequeue();

  while (currentTree) {
    for (var i = 0, length = currentTree.children.length; i < length; i++) {
      queue.enqueue(currentTree.children[i]);
    }

    callback(currentTree);
    currentTree = queue.dequeue();
  }
};

Tree.prototype.contains = function (callback, traversal) {
  traversal.call(this, callback);
};

Tree.prototype.add = function (data, parentId, traversal) {
  var child = new Node(data);
  var parent = null;
  var callback = function (node) {
    // if (node.data === toData) {
    //   parent = node;
    // }

    if (node.data.id === parentId) {
      parent = node;
    }
  };

  this.contains(callback, traversal);

  if (parent) {
    parent.children.push(child);
    child.parent = parent;
  } else {
    throw new Error('Cannot add node to a non-existent parent.');
  }
};

function findIndex(arr, data) {
  var index;

  for (var i = 0; i < arr.length; i++) {
    if (arr[i].data.id === data.id) {
      index = i;
    }
  }

  return index;
}

Tree.prototype.remove = function (data, parentId, traversal) {
  // var tree = this;
  var parent = null;
  var childToRemove = null;
  var index;

  var callback = function (node) {
    // if (node.data === fromData) {
    //   parent = node;
    // }

    if (node.data.id === parentId) {
      parent = node;
    }
  };

  this.contains(callback, traversal);

  if (parent) {
    index = findIndex(parent.children, data);

    if (index === undefined) {
      throw new Error('Node to remove does not exist.');
    } else {
      childToRemove = parent.children.splice(index, 1);
    }
  } else {
    throw new Error('Parent does not exist.');
  }

  return childToRemove;
};
