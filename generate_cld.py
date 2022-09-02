"""
generate_cld.py

Generates causal loop diagramm in HTML format based on input file

Hans Rauch
(c) MIT LICENSE
2022-09-02
Version 0.86
"""

import random
import re
import sys

causal_raw = """
R = 60
Regen (1;1;Der Regen ist die Basis allen Lebens)
Weide (3;2;Nahrungsgrundlage für viele Beutetiere)
Beute (4;4;Nahrungsgrundlage für viele Jäger)
Jäger (1;4;Spitze der Nahrungspyramide;#a00000)

Regen +> Weide (Der Regen fördert das Wachstum der Pflanzen;2)
Weide +> Beute (Eine üppige Wiese kann viele Beutetiere ernähren;2)
Beute ++> Jäger (Viele Beutetiere sind eine gute Nahrungsgrundlage für Jäger)
Jäger --> Beute (Jäger hält die Anzahl der Beutetiere im Gleichgewicht)
"""

def get_node_id(nodes: list, name: str) -> int:
    """
    find the node-id for <name>
    """
    for n in nodes:
        if n[5] == name:
            return n[0]
    return -1


def generate_causal_diagram(raw: str) -> str:
    """
    generate nodes and edges
    """
    nodes = []
    edges = []
    UID = 'r' + str(random.random())[2:11]
    base_color = '#e0e0ff'

    R = 60
    lines = raw.strip().split('\n')
    for line in lines:
        line = line.strip()
        # read radius
        n_pos = line.find('=')
        if n_pos > 0 and line.startswith('R'):
            line = line[n_pos+1:]
            try:
                R = int(line.strip())
            except:
                pass
            line = ""
        if line:
            com = re.search(r'[-,+]+>+', line)
            if com:
                bend = 50
                url = ''
                info = ''
                name_from = line[:com.start()].strip().strip()
                name_from_id = get_node_id(nodes, name_from)
                strength = len(line[com.start():com.end()].replace('>', ''))
                if line[com.start()] == '+':
                    strength = 1 * strength
                else:
                    strength = -1 * strength
                line = line[com.end():].strip()
                com = re.search(r'[\( ]', line)
                if not com:
                    name_to = line.strip()
                    name_to_id = get_node_id(nodes, name_to)
                else:
                    n_start = com.start()
                    name_to = line[:n_start].strip()
                    name_to_id = get_node_id(nodes, name_to)
                    line = line[n_start:].strip()
                    com = re.search(r'\(.*\)', line)
                    if com:
                        line = line[1:-1]
                        items = line.split(";")
                        info = items[0].strip()
                        try:
                            bend = int(items[1]) * 10
                        except:
                            pass
                        if len(items) > 2:
                            url = items[1].strip()
                        elif info:
                            url = '#'
                edge = [name_from_id, name_to_id, bend, strength, url, info]
                edges.append(edge)
            else:
                n_pos = line.find('(')
                if n_pos > 0:
                    name = line[:n_pos].strip()
                    com = re.search(r'\(.*\)', line)
                    if com:
                        raw_params = line[com.start()+1:com.end()-1].split(';')
                        params = []
                        params.append(int(raw_params[0]))
                        params.append(int(raw_params[1]))
                        for p in raw_params[2:]:
                            params.append(p.strip())
                        if len(raw_params) < 3:
                            params.append('')
                            params.append(base_color)
                            params.append('')
                        elif len(raw_params) < 4:
                            params.append(base_color)
                            params.append('')
                        elif len(raw_params) < 5:
                            params.append(base_color)

                    if (params[2] and not params[4]):
                        params[4] = '#'
                    d = (R - 10)*2
                    node = [len(nodes), d*params[0], d*params[1], params[3], params[4], name, params[2]]
                nodes.append(node)

    # HTML template

    data = f"""
    <div class="row mt-3">
        <div class="col-md-9">
            <svg id="svg_{UID}" width="600px" height="400px" viewbox="0 0 600 400"></svg>
        </div>
        <div class="col-md-3">
            <div id="svg_{UID}_info"></div>
        </div>
    </div>
    <script>
        var rcld_{UID} = new RoughCld("svg_{UID}")
        nodes = {nodes}
        edges = {edges}
        rcld_{UID}.draw_cld(nodes, edges, true)
    </script>

    ----------------------------------------------------------
        
    <div class="row mt-3">
        <div class="col-md-9">
            <svg id="svg_{UID}" width="800px" height="600px"></svg>
        </div>
        <div class="col-md-3">
            <div id="svg_{UID}_info"></div>
        </div>
    </div>
    <div class="col-12">
        <div class="btn-group" role="group" aria-label="forward / backward">
            <button class="btn btn-light" onclick="rcld_{UID}.prev_edge()">
                <span class="fas fa-chevron-circle-left"></span>
            </button>
            <button class="btn btn-light" onclick="rcld_{UID}.next_edge()">
                <span class="fas fa-chevron-circle-right"></span>
            </button>
        </div>
    </div>
    <script>
        var rcld_{UID} = new RoughCld("svg_{UID}")
        nodes = {nodes}
        edges = {edges}
        rcld_{UID}.draw_cld(nodes, edges, true)
    </script>
"""
    return data.replace("'", '"')


# read input file and generate output file
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print ('Usage: python generate_cls.py <filename>')
    else:
        filename = sys.argv[1]
        n_pos = filename.rfind('.')
        if n_pos > 0:
            f_name = filename[:n_pos]
        else:
            f_name = filename
        f_name += '.html'

        with open(filename, 'r') as f:
            causal_raw = f.read()
        causal_text = generate_causal_diagram(causal_raw)
        with open(f_name, 'w') as f:
            f.write(causal_text)
        print (f'Result: {f_name}')
