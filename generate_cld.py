import random
import re
import pprint


# causal_raw = """
# Regen (2,1,blue)
# Weide (5,2,green)
# Beute (5,4):Z.B. Mäuse, Kaninchen, Würmer
# Räuber (2,4,red):Z.B. Füchse
#
# Regen ++> Weide: Der Regen fördert das Wachstum
# Weide +>> Beute: Das Gras ernährt die Beute
# Beute ++>> Räuber: Nur bei genügend vielen Beutetieren können Räuber überleben
# Räuber -> Beute: Das Anwachsen der Beutetiere wird begrenzt
# Beute -> Weide: Nahrung wird geringer
# """
# Beute +> Weide: Die Beutetiere düngen die Weide
R = 60
causal_raw = """
Regen (1;1;#;Der Regen ist die Basis allen Lebens)
Weide (3;2;#;Nahrungsgrundlage für viele Beutetiere)
Beute (4;4;#;Nahrungsgrundlage für viele Jäger)
Jäger (1;4;#;Spitze der Nahrungspyramide;#a00000)
Regen +> Weide (2;#;Der Regen fördert das Wachstum der Pflanzen)
Weide +> Beute (2;#;Eine üppige Wiese kann viele Beutetiere ernähren)
Beute ++> Jäger (6;#;Viele Beutetiere sind eine gute Nahrungsgrundlage für Jäger)
Jäger --> Beute (6;#;Jäger hält die Anazhl der Beutetiere im Gleichgewicht)
"""

#def get_js_line(tokens) -> str:
#    """
#    """
#    n = 0
#    tokens = list(tokens)
#    while n < len(tokens):
#        token = tokens[n]
#        print (token.type, token.string)


def get_node_id(nodes: list, name: str) -> int:
    """
    """
    for n in nodes:
        if n[5] == name:
            return n[0]
    return -1


def generate_causal_diagram(raw: str) -> str:
    """
    """
    nodes = []
    edges = []
    UID = 'r' + str(random.random())[2:11]
    base_color = '#e0e0ff'

    lines = raw.strip().split('\n')
    for line in lines:
        line = line.strip()
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
                print (line)
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
                        try:
                            bend = int(items[0]) * 10
                            if bend == 0:
                                bend = 50
                        except:
                            pass
                        if len(items) > 1:
                            url = items[1].strip()
                        if len(items) > 2:
                             info = items[2].strip()
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
                            params.append('')
                            params.append(base_color)
                        elif len(raw_params) < 4:
                            params.append('')
                            params.append(base_color)
                        elif len(raw_params) < 5:
                            params.append(base_color)
                    d = (R - 10)*2
                    node = [len(nodes), d*params[0], d*params[1], params[4], params[2], name, params[3]]
                nodes.append(node)

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

causal_text = generate_causal_diagram(causal_raw)

print (causal_text)
