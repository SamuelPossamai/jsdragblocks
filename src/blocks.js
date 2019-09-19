"use strict";

class Block {

    constructor(name, x, y, w, h, in_qtd, out_qtd) {

        this.in_qtd = in_qtd == null ? 0 : in_qtd;
        this.out_qtd = out_qtd == null ? 0 : out_qtd;

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.name = name;
        this.font = `${Math.trunc((w + h)/10)}px Georgia`;
        this.connector_size = this.h/10;
    }

    draw(ctx, selected) {

        this.drawBlock(ctx, selected);
        this.drawConnectors(ctx, selected);
    }

    drawBlock(ctx, selected) {

        ctx.lineWidth = 2;

        ctx.fillStyle = this.bg_color || "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = this.fg_color || "#000000";
        ctx.font = this.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.x + this.w/2, this.y + this.h/2)
        if(selected) {
            ctx.strokeStyle = this.sel_border_color || "#FF0000";
        }
        else {
            ctx.strokeStyle = this.border_color || "#000000";
        }
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }

    drawConnectors(ctx, _selected, color) {

        ctx.fillStyle = color == null ? "#0000FF" : color;
        this._draw_vertical_points(ctx, this.in_qtd, this.x);
        this._draw_vertical_points(ctx, this.out_qtd, this.x + this.w);
    }

    collide(other) {

        return this.x < other.x + other.w && this.x + this.w > other.x &&
            this.y < other.y + other.h && this.y + this.h > other.y
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

    saveJSON(stringify) {

        let obj = {

            'x': this.x,
            'y': this.y,
            'width': this.w,
            'height': this.h,
            'name': this.name,
            'inputs': this.in_qtd,
            'outputs': this.out_qtd
        }

        if(stringify !== false) {

            return JSON.stringify(obj);
        }

        return obj;
    }
}

class BlockConnection {

    constructor(block_out, n_out, block_in, n_in, cbv) {

        this.block_out = block_out;
        this.n_out = n_out;
        this.block_in = block_in;
        this.n_in = n_in;

        this.moving_pos = null;

        this._cbv = cbv;
    }

    draw(ctx) {

        const b_out_con_size = this.block_out.connector_size;
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

            if(CanvasBlockViewer._test_if_inside(end[0], end[1], start[0], start[1], 3*b_out_con_size)) {

                return;
            }
        }

        ctx.strokeStyle = this._get_color();
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);

        if(start[0] + 40 < end[0] || (end[0] > start[0] && end[0] - start[0] <= 40 && (this.block_in === null || (
            this.block_out.y < this.block_in.y + this.block_in.h && this.block_out.y + this.block_out.h > this.block_in.y)))) {

            const middle_x = start[0] + (end[0] - start[0])/2;

            ctx.lineTo(middle_x, start[1]);
            ctx.lineTo(middle_x, end[1]);
        }
        else {

            const middle_y = start[1] + (end[1] - start[1])/2;

            let y_turn = null;

            const diff_center_y = middle_y - this.block_out.y - this.block_out.h/2;
            if(Math.abs(diff_center_y) > this.block_out.h) {
                y_turn = middle_y;
            }
            else {
                if(diff_center_y > 0) {
                    y_turn = this.block_out.y + 3*this.block_out.h/2;
                    if(this.moving_pos === null) {
                        const in_y_turn = this.block_in.y + 3*this.block_in.h/2;
                        if(in_y_turn > y_turn) {
                            y_turn = in_y_turn;
                        }
                    }
                }
                else {
                    y_turn = this.block_out.y - this.block_out.h/2
                    if(this.moving_pos === null) {
                        const in_y_turn = this.block_in.y - this.block_in.h/2;
                        if(in_y_turn < y_turn) {
                            y_turn = in_y_turn;
                        }
                    }
                }
            }

            let x_start = start[0] + 20;
            if(this.moving_pos === null && y_turn != middle_y && this.block_in.x + this.block_in.w > start[0]) {
                x_start = this.block_in.x + this.block_in.w + 20;
            }

            ctx.lineTo(x_start, start[1]);
            ctx.lineTo(x_start, y_turn);
            ctx.lineTo(end[0] - 20, y_turn);
            ctx.lineTo(end[0] - 20, end[1]);
        }

        ctx.lineTo(end[0] - arrow_x_offset - 2, end[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end[0] - arrow_width - arrow_x_offset, end[1] - arrow_height);
        ctx.lineTo(end[0] - arrow_x_offset, end[1]);
        ctx.lineTo(end[0] - arrow_width - arrow_x_offset, end[1] + arrow_height);
        ctx.closePath();
        ctx.fillStyle = this._get_color();
        ctx.fill();
    }

    _get_color() {

        const out_get_color_func = this.block_out.connectionColor;

        let connection_color = null;
        let connection_color_priority = null;

        if(out_get_color_func != null) {
            let out_result = this.block_out.connectionColor(true, this.n_out);

            if(out_result instanceof Array) {
                connection_color = out_result[0];
                connection_color_priority = out_result[1];
            }
            else {

                connection_color = out_result;
            }
        }

        if(this.block_in != null) {
            const in_get_color_func = this.block_in.connectionColor;

            if(in_get_color_func != null) {

                let in_result = this.block_in.connectionColor(false, this.n_in);
                if(in_result instanceof Array) {

                    if(connection_color_priority === null || in_result[1] <= connection_color_priority) {
                        connection_color = in_result[0];
                        connection_color_priority = in_result[1];
                    }
                }
                else if(connection_color_priority === null) {

                    connection_color = in_result;
                }
            }
        }

        return connection_color !== null ? connection_color : this._cbv.connection_color;
    }
}

class CanvasBlockViewer {

    constructor(canvas_id) {

        let cbv = this;

        this.select_callback = null;
        this.connection_color = "#0000FF";

        this._blocks = new Map();
        this._connections = [];
        this._canvas_id = canvas_id;
        this._block_clicked = null;
        this._connection_clicked = null;
        this._clicked_x_off = 0;
        this._clicked_y_off = 0;
        this._before_click_block_x = 0;
        this._before_click_block_y = 0;
        this._block_invalid_position = false;
        this._moved_after_press = false;
        this._selected_block = null;
        this._clicked_blank_point = null;
        this._translate = [0, 0];
        this._zoom = 1;

        let canvas = document.getElementById(this._canvas_id);

        canvas.addEventListener('mousedown', function(event) { CanvasBlockViewer._canvas_mousedown_event(cbv, event); }, false);
        canvas.addEventListener('mouseup', function(event) { CanvasBlockViewer._canvas_mouseup_event(cbv, event); }, false);
        canvas.addEventListener('mousemove', function(event) { CanvasBlockViewer._canvas_mousemove_event(cbv, event); }, false);
    }

    _saveJSON_connection_push(connection, block_info, type, other_block_id) {

        if(block_info[type] == null) {

            block_info[type] = [];
        }

        block_info[type].push({

            'input_number': connection.n_in,
            'output_number': connection.n_out,
            'block': other_block_id
        })
    }

    zoomIn(value) {

        this._zoom *= value;
        this.redraw();
    }

    zoomOut(value) {

        this._zoom /= value;
        this.redraw();
    }

    saveJSON(stringify) {

        let output = [];
        let block_to_id = new Map();

        let i = 0;

        for(let [_, block] of this._blocks) {

            output.push(block.saveJSON(false));

            block_to_id.set(block, i);

            i++;
        }

        for(let connection of this._connections) {

            if(connection.block_in != null && connection.block_out != null) {

                let in_block_id = block_to_id.get(connection.block_in);
                let out_block_id = block_to_id.get(connection.block_out);

                this._saveJSON_connection_push(connection, output[in_block_id], 'input', out_block_id);
                this._saveJSON_connection_push(connection, output[out_block_id], 'output', in_block_id);
            }
        }

        if(stringify !== false) {

            return JSON.stringify(output);
        }

        return output;
    }

    loadJSONCreateBlockDefault(block_json) {

        return new Block(block_json.name, block_json.x, block_json.y, block_json.width,
                         block_json.height, block_json.inputs, block_json.outputs);
    }

    loadJSON(blocks_json_info, parse_string, args) {

        if(parse_string !== false) {
            blocks_json_info = JSON.parse(blocks_json_info);
        }

        let create_block = null;

        if(args != null && args.create_block != null) {

            create_block = args.create_block;
        }
        else create_block = this.loadJSONCreateBlockDefault;

        if(args != null && args.clear_before === true) {

            this._blocks.clear();
            this._connections.length = 0;
            this._block_clicked = null;
            this._connection_clicked = null;
            this._block_invalid_position = false;
            this._moved_after_press = false;
            this._selected_block = null;
            this._translate = [0, 0];
            this._clicked_blank_point = null;
            this._zoom = 1;
        }

        const pos_to_block = new Map();

        for(let i = 0; i < blocks_json_info.length; i++) {

            const block_json = blocks_json_info[i];

            let block = create_block(block_json);
            this.addBlock(block, false);

            pos_to_block.set(i, block);
        }

        for(let i = 0; i < blocks_json_info.length; i++) {

            const block_json = blocks_json_info[i];

            const block = pos_to_block.get(i);

            if(block_json.output == null) continue;

            for(let output_info of block_json.output) {

                const out_block = pos_to_block.get(output_info.block);

                this.addConnection(block.name, output_info.output_number,
                                   out_block.name, output_info.input_number);
            }
        }

        this.redraw();
    }

    addBlock(block, need_redraw) {

        if(this._blocks.get(block.name) != null) return false;

        this._blocks.set(block.name, block);

        if(need_redraw !== false) {
            this.redraw();
        }

        return true;
    }

    remBlock(block, need_redraw) {

        if(!this._blocks.delete(block.name)) return false;

        this._connections = this._connections.filter((value) => {

            return value.block_in != block && value.block_out != block;
        })

        if(need_redraw !== false) {
            this.redraw();
        }

        return true;
    }

    findBlock(block_name) {

        return this._blocks.get(block_name);
    }

    addConnection(block_in, n_in, block_out, n_out, need_redraw) {

        const b_in = this._blocks.get(block_in);
        const b_out = this._blocks.get(block_out);

        this._connections.push(new BlockConnection(b_in, n_in, b_out, n_out, this))

        if(need_redraw !== false) {
            this.redraw();
        }
    }

    redraw() {

        let canvas = document.getElementById(this._canvas_id);
        let ctx = canvas.getContext("2d");

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(this._translate[0], this._translate[1]);
        ctx.scale(this._zoom, this._zoom);

        for(let [_, block] of this._blocks) {
            block.drawBlock(ctx, this._selected_block === block);
        }

        for(let connection of this._connections) {
            connection.draw(ctx);
        }

        for(let [_, block] of this._blocks) {
            block.drawConnectors(ctx, this._selected_block === block);
        }

    }

    static _test_if_inside(x, y, cx, cy, half_side) {

        return x > cx - half_side && x < cx + half_side && y > cy - half_side && y < cy + half_side
    }

    _find_block_inout_next_to_point(x, y, is_input) {

        for(let [block_name, block] of this._blocks) {

            const qtd = is_input ? block.in_qtd : block.out_qtd;

            for(let i = 0; i < qtd; i++) {

                const p_pos = is_input ? block.inputPoint(i) : block.outputPoint(i);
                const c_size = block.connector_size;

                if(CanvasBlockViewer._test_if_inside(x, y, p_pos[0], p_pos[1], c_size)) {
                    return [block, i];
                }
            }
        }

        return null;
    }

    static _canvas_mousedown_event(cbv, event) {

        cbv._moved_after_press = false;

        const rect = event.target.getBoundingClientRect();
        const not_translated_x = event.clientX - rect.left;
        const not_translated_y = event.clientY - rect.top;
        const x = (not_translated_x - cbv._translate[0])/cbv._zoom;
        const y = (not_translated_y - cbv._translate[1])/cbv._zoom;

        for(let i = cbv._connections.length - 1; i >= 0; i--) {

            let connection = cbv._connections[i];

            const end_point = connection.block_in.inputPoint(connection.n_in);

            if(CanvasBlockViewer._test_if_inside(x, y, end_point[0], end_point[1], connection.block_in.connector_size)) {

                document.getElementById(cbv._canvas_id).style.cursor = "copy";
                cbv._connection_clicked = connection;

                return;
            }
        }

        let block_found = cbv._find_block_inout_next_to_point(x, y, false);

        if(block_found != null) {

            let connection = new BlockConnection(block_found[0], block_found[1], null, 0, cbv);
            cbv._connections.push(connection);
            cbv._connection_clicked = connection;
            return;
        }

        let block_clicked = null;
        for(let [_, block] of cbv._blocks) {
            if(block.pointIsInsideBlock(x, y) === true) {
                block_clicked = block;
            }
        }

        if(block_clicked !== null) {

            cbv._block_clicked = block_clicked;

            cbv._clicked_x_off = x - block_clicked.x;
            cbv._clicked_y_off = y - block_clicked.y;

            cbv._before_click_block_x = block_clicked.x;
            cbv._before_click_block_y = block_clicked.y;

            cbv._clicked_blank_point = null;
        }
        else {

            if(cbv._selected_block !== null) {
                cbv._selected_block = null;
                if(cbv.select_callback != null) {

                    cbv.select_callback(null);
                }
                cbv.redraw();
            }
            cbv._clicked_blank_point = [not_translated_x, not_translated_y];
        }
    }

    static _canvas_mouseup_event_connection_clicked(cbv) {

        const connection = cbv._connection_clicked;
        const current_position = connection.moving_pos;

        let block_found = cbv._find_block_inout_next_to_point(current_position[0], current_position[1], true);

        if(block_found != null) {

            connection.block_in = block_found[0];
            connection.n_in = block_found[1];
        }
        else {

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

    static _canvas_mouseup_event(cbv, event) {

        cbv._clicked_blank_point = null;

        if(cbv._connection_clicked !== null) {

            CanvasBlockViewer._canvas_mouseup_event_connection_clicked(cbv);
        }
        else if(cbv._block_clicked !== null && cbv._moved_after_press === false) {

            cbv._selected_block = cbv._block_clicked;

            if(cbv.select_callback != null) {

                cbv.select_callback(cbv._selected_block);
            }

            cbv.redraw();
        }
        else if(cbv._block_clicked !== null && this._block_invalid_position === true) {

            cbv._block_clicked.x = cbv._before_click_block_x;
            cbv._block_clicked.y = cbv._before_click_block_y;

            cbv.redraw();
        }

        document.getElementById(cbv._canvas_id).style.cursor = "auto";
        cbv._block_clicked = null;
    }

    static _canvas_mousemove_event(cbv, event) {

        cbv._moved_after_press = true;
        document.getElementById(cbv._canvas_id).style.cursor = "auto";

        const rect = event.target.getBoundingClientRect();
        const not_translated_x = event.clientX - rect.left;
        const not_translated_y = event.clientY - rect.top;
        const x = (not_translated_x - cbv._translate[0])/cbv._zoom;
        const y = (not_translated_y - cbv._translate[1])/cbv._zoom;

        if(cbv._clicked_blank_point !== null) {

            cbv._translate[0] += (not_translated_x - cbv._clicked_blank_point[0]);
            cbv._translate[1] += (not_translated_y - cbv._clicked_blank_point[1]);
            cbv._clicked_blank_point = [not_translated_x, not_translated_y];

            cbv.redraw();
        }
        else if(cbv._block_clicked !== null) {

            this._block_invalid_position = false;
            for(let [block_name, block] of cbv._blocks) {

                if(cbv._block_clicked !== block && cbv._block_clicked.collide(block)) {

                    document.getElementById(cbv._canvas_id).style.cursor = "no-drop";
                    this._block_invalid_position = true;
                    break;
                }
            }

            cbv._block_clicked.x = x - cbv._clicked_x_off;
            cbv._block_clicked.y = y - cbv._clicked_y_off;

            cbv.redraw();
        }
        else if(cbv._connection_clicked !== null) {

            cbv._connection_clicked.moving_pos = [x, y];

            cbv.redraw();
        }
        else {

            let can_move = false;
            for(let [_, block] of cbv._blocks) {
                if(block.pointIsInsideBlock(x, y) === true) {
                    document.getElementById(cbv._canvas_id).style.cursor = "move";
                    return;
                }
            }

            for(let connection of cbv._connections) {

                const end_point = connection.block_in.inputPoint(connection.n_in);

                if(CanvasBlockViewer._test_if_inside(x, y, end_point[0], end_point[1], connection.block_in.connector_size)) {

                    document.getElementById(cbv._canvas_id).style.cursor = "move";
                    return;
                }
            }

            let block_found = cbv._find_block_inout_next_to_point(x, y, false);

            if(block_found != null) {

                document.getElementById(cbv._canvas_id).style.cursor = "move";
                return;
            }
        }
    }
}
