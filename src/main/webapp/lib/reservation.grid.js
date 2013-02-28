/**
 * Implementation of Jim Scott's lightmap packing algorithm (http://www.blackpawn.com/texts/lightmaps/)
 * with accommodations made for a fixed area and items which can change their area. The grid is
 * instantiated specifyin the size of individual blocks and the number of blocks wide and tall.
 *
 * You clear the grid, by calling grid.clear(), and requesting available areas by repeatably calling
 * grid.reserve(w, h). If the grid is full, the call to reserve will result in a null response, otherwise
 * it will return an object containing the position and size information of the reservation:
 *     { x:2, y:4, w:1, h: 3 }
 *
 * The reservation system will attempt to locate available space that fits your requested dimensions,
 * but in cases when that is not possible, a new size will be returned. The maxW and maxH parameters
 * are included to keep these new sizes as constrained as possible.
 *
 * @param {Number} w
 * @param {Number} h
 * @param {Number} maxW
 * @param {Number} maxH
 * @constructor
 */
var ReservationGrid = function (w, h, maxW, maxH) {
    this.init(w, h, maxW, maxH);
};

ReservationGrid.prototype = {
    init: function (w, h, maxW, maxH) {
        this.w = w;
        this.h = h;
        this.maxW = maxW;
        this.maxH = maxW;

        // This is the root of our binary tree. It will acquire branches
        // through properties added to it named 'left' and 'right'. This
        // creates the tree structure. When a block is associated
        // with a node, the node gets a 'used' property set to the abstract.
        this.root = { x: 0, y: 0, w: w, h: h };
    },

    /**
     * Clears all of the blocks from the layout.
     */
    clear: function () {
        this.root = { x: 0, y: 0, w: this.w, h: this.h };
    },

    /**
     * Adds the abstract to the layout. This routine will find a space for
     * the abstract, even if it has to change its size.
     *
     * abstract.setSize(w, h) will be invoked if the abstract's size has to
     * be adjusted.
     *
     * @param w
     * @param h
     * @return {Object} The reserved position and size of the block. ie { x:2, y:1, w:1, h:3 }
     */
    reserve: function (w, h) {
        // Starting with the root, traverse the tree until an unused space that will hold
        // the block is found.
        var node = this.findNode(this.root, w, h);

        // If no perfect space is found...
        if (!node) {
            // Find the next available spot
            node = this.findSpace(this.root);
            // If we have a space, adjust the reservation dimensions to the realities of the space
            if (node) {
                w = Math.min(node.w, this.maxW);
                h = Math.min(node.h, this.maxH);
            }
        }

        // If we still don't have a node, then we are all full up
        if (!node) return null;

        // If we have a spot, we need to branch our tree to accommodate for the 0 - 2 additional
        // spots our new block has created
        node = this.splitNode(node, w, h);

        // Update the abstract with the new position
        return { x: node.x, y: node.y, w: node.w, h: node.h };
    },

    findNode: function (root, w, h) {
        if (!root) return null;
        if (root.used) {
            var right = this.findNode(root.right, w, h);
            var left = this.findNode(root.left, w, h);
            return (Math.random() < 0.5) ? right || left : left || right;
        }
        else if ((w <= root.w) && (h <= root.h))
            return root;
        else
            return null;
    },

    findSpace: function (root) {
        if (!root) return null;
        if (root.used)
            return this.findSpace(root.right) || this.findSpace(root.left) || null;
        return root;
    },

    /**
     * Splitting a node breaks up the remaining space after a node is claimed into
     * two rectangular regions. If we just break the space into the area below the
     * node and the area to the right of the node, we will end up with rows of
     * layout. If we do the opposite, we end up with columns of blocks. We want to
     * randomize the effect, so this routing will do that.
     *
     * @param node
     * @param w
     * @param h
     * @return {*}
     */
    splitNode: function (node, w, h) {
        function splitDownRight() {
            if (node.h !== h)
                node.left = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
            if (node.w !== w)
                node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h };
        }
        function splitRightDown() {
            if (node.h !== h)
                node.left = { x: node.x, y: node.y + h, w: w, h: node.h - h };
            if (node.w !== w)
                node.right = { x: node.x + w, y: node.y, w: node.w - w, h: node.h };
        }
        node.used = true;

        if (Math.random() < 0.5) splitRightDown(); else splitDownRight();
        node.w = w;
        node.h = h;
        return node;
    }
};