"use strict";

class Block {

    constructor(name, x, y, w, h, in_qtd, out_qtd) {

        if(in_qtd == null) {
            this.in_qtd = 0;
        }
        else {
            this.in_qtd = in_qtd;
        }

        if(out_qtd == null) {
            this.out_qtd = 0;
        }
        else {
            this.out_qtd = out_qtd;
        }

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.name = name;
        this.font = "20px Georgia"
        this.connector_size = this.h/10;
    }

    draw(ctx) {

        ctx.lineWidth = 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#000000";
        ctx.font = this.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.x + this.w/2, this.y + this.h/2)
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = "#0000FF";
        this._draw_vertical_points(ctx, this.in_qtd, this.x)
        this._draw_vertical_points(ctx, this.out_qtd, this.x + this.w)
    }

    pointIsInsideBlock(x, y) {

        if(x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h) {

            return true;
        }

        return false;
    }

    inputPoint(input_number) {

        return [this.x, this.y + (input_number + 1)*this.h/(this.in_qtd + 1)]
    }

    outputPoint(output_number) {

        return [this.x + this.w, this.y + (output_number + 1)*this.h/(this.out_qtd + 1)]
    }

    _draw_vertical_points(ctx, npoints, x) {

        for(let i = 0; i < npoints; i++) {
            ctx.beginPath();
            ctx.arc(x, this.y + (i + 1)*this.h/(npoints + 1), this.connector_size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

class BlockConnection {

    constructor(block_out, n_out, block_in, n_in) {

        this.block_out = block_out;
        this.n_out = n_out;
        this.block_in = block_in;
        this.n_in = n_in;

        this.moving_pos = null;
    }

    draw(ctx) {

        const arrow_width = 10;
        const arrow_x_offset = 5;
        const arrow_height = 7;

        const start = this.block_out.outputPoint(this.n_out);

        let end = null;
        if(this.moving_pos === null) {

            end = this.block_in.inputPoint(this.n_in);
        }
        else {

            end = this.moving_pos;
        }

        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);

        if(start[0] + 40 < end[0]) {

            const middle_x = start[0] + (end[0] - start[0])/2;

            ctx.lineTo(middle_x, start[1]);
            ctx.lineTo(middle_x, end[1]);
        }
        else {

            const middle_y = start[1] + (end[1] - start[1])/2;

            ctx.lineTo(start[0] + 20, start[1]);
            ctx.lineTo(start[0] + 20, middle_y);
            ctx.lineTo(end[0] - 20, middle_y);
            ctx.lineTo(end[0] - 20, end[1]);
        }

        ctx.lineTo(end[0] - arrow_x_offset - 2, end[1]);
        ctx.stroke();


        ctx.beginPath();
        ctx.moveTo(end[0] - arrow_width - arrow_x_offset, end[1] - arrow_height);
        ctx.lineTo(end[0] - arrow_x_offset, end[1]);
        ctx.lineTo(end[0] - arrow_width - arrow_x_offset, end[1] + arrow_height);
        ctx.closePath();
        ctx.fillStyle = "#0000FF";
        ctx.fill();
    }
}

class CanvasBlockViewer {

    constructor(canvas_id) {

        let cbv = this;

        this._blocks = new Map();
        this._connections = [];
        this._canvas_id = canvas_id;
        this._block_clicked = null;
        this._connection_clicked = null;
        this._clicked_x_off = 0;
        this._clicked_y_off = 0;

        let canvas = document.getElementById(this._canvas_id);

        canvas.addEventListener('mousedown', function(event) { CanvasBlockViewer._canvas_mousedown_event(cbv, event); }, false);
        canvas.addEventListener('mouseup', function(event) { CanvasBlockViewer._canvas_mouseup_event(cbv, event); }, false);
        canvas.addEventListener('mousemove', function(event) { CanvasBlockViewer._canvas_mousemove_event(cbv, event); }, false);
    }

    addBlock(block, need_redraw) {

        this._blocks.set(block.name, block);

        if(need_redraw !== false) {
            this.redraw();
        }
    }

    addConnection(block_in, n_in, block_out, n_out, need_redraw) {

        const b_in = this._blocks.get(block_in);
        const b_out = this._blocks.get(block_out);

        this._connections.push(new BlockConnection(b_in, n_in, b_out, n_out))

        if(need_redraw !== false) {
            this.redraw();
        }
    }

    redraw() {

        let canvas = document.getElementById(this._canvas_id);
        let ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(let [_, block] of this._blocks) {
            block.draw(ctx);
        }

        for(let connection of this._connections) {

            connection.draw(ctx);
        }
    }

    static _test_if_inside(x, y, cx, cy, half_side) {

        return x > cx - half_side && x < cx + half_side && y > cy - half_side && y < cy + half_side
    }

    static _canvas_mousedown_event(cbv, event) {

        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        for(let connection of cbv._connections) {

            const end_point = connection.block_in.inputPoint(connection.n_in);

            if(CanvasBlockViewer._test_if_inside(x, y, end_point[0], end_point[1], connection.block_in.connector_size)) {

                document.getElementById(cbv._canvas_id).style.cursor = "copy";
                cbv._connection_clicked = connection;

                return;
            }
        }

        for(let [block_name, block] of cbv._blocks) {

            for(let i = 0; i < block.out_qtd; i++) {

                const out_pos = block.outputPoint(i);
                const out_size = block.connector_size;

                if(CanvasBlockViewer._test_if_inside(x, y, out_pos[0], out_pos[1], out_size)) {

                    document.getElementById(cbv._canvas_id).style.cursor = "copy";

                    let connection = new BlockConnection(block, i, null, 0);
                    cbv._connections.push(connection);
                    cbv._connection_clicked = connection;
                    return;
                }
            }
        }

        let block_clicked = null;
        for(let [_, block] of cbv._blocks) {
            if(block.pointIsInsideBlock(x, y) === true) {
                block_clicked = block;
            }
        }

        if(block_clicked !== null) {

            cbv._block_clicked = block_clicked;
            document.getElementById(cbv._canvas_id).style.cursor = "copy";

            cbv._clicked_x_off = x - block_clicked.x;
            cbv._clicked_y_off = y - block_clicked.y;
        }
    }

    static _canvas_mouseup_event(cbv, event) {

        cbv._block_clicked = null;

        if(cbv._connection_clicked !== null) {

            const connection = cbv._connection_clicked;
            const current_position = connection.moving_pos;

            let input_found = false;
            for(let [block_name, block] of cbv._blocks) {

                for(let i = 0; i < block.in_qtd; i++) {

                    const in_pos = block.inputPoint(i);
                    const in_size = block.connector_size;

                    if(CanvasBlockViewer._test_if_inside(current_position[0], current_position[1], in_pos[0], in_pos[1], in_size)) {

                        connection.block_in = block;
                        connection.n_in = i;
                        input_found = true;
                        break;
                    }
                }
            }

            if(input_found === false) {

                const out_pos = connection.block_out.outputPoint(connection.n_out);
                const out_size = connection.block_out.connector_size;

                if(connection.block_in == null || CanvasBlockViewer._test_if_inside(current_position[0], current_position[1], out_pos[0], out_pos[1], 3*out_size)) {

                    cbv._connections.splice(cbv._connections.indexOf(connection), 1);
                }
            }

            connection.moving_pos = null;
            cbv._connection_clicked = null;

            cbv.redraw();
        }
        document.getElementById(cbv._canvas_id).style.cursor = "auto";
    }

    static _canvas_mousemove_event(cbv, event) {

        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if(cbv._block_clicked !== null) {

            cbv._block_clicked.x = x - cbv._clicked_x_off;
            cbv._block_clicked.y = y - cbv._clicked_y_off;

            cbv.redraw();
        }
        else if(cbv._connection_clicked !== null) {

            cbv._connection_clicked.moving_pos = [x, y];

            cbv.redraw();
        }
    }
}
