import zipfile
import xml.etree.ElementTree as ET
import os
import io
import json
from PIL import Image
import sys
import glob

UPLOADS_DIR = 'apps/server/uploads/teams/avatars'
os.makedirs(UPLOADS_DIR, exist_ok=True)

all_updates = []

for excel_file in glob.glob('excel_templates/*.xlsx'):
    print(f"Processing {excel_file}...")
    team_prefix = os.path.basename(excel_file).split('_')[0]

    with zipfile.ZipFile(excel_file, 'r') as z:
        sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        row_vm_map = {}
        row_id_map = {}
        row_name_map = {}
        
        shared_strings = []
        try:
            sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in sst.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                if t is not None:
                    shared_strings.append(t.text)
                else:
                    texts = [t_node.text for t_node in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t_node.text]
                    shared_strings.append(''.join(texts))
        except Exception as e:
            pass
            
        for c in sheet.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            r = c.attrib.get('r', '')
            if not r: continue
            
            row_num = int(''.join(filter(str.isdigit, r)))
            col_letter = ''.join(filter(str.isalpha, r))
            
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else None
            
            if c.attrib.get('t') == 's' and val is not None:
                val = shared_strings[int(val)]
                
            if col_letter == 'A':
                row_id_map[row_num] = val
            elif col_letter == 'B':
                row_name_map[row_num] = val
            elif col_letter == 'C':
                if 'vm' in c.attrib:
                    row_vm_map[row_num] = int(c.attrib['vm'])
                    
        vm_to_rv = {}
        try:
            metadata = ET.fromstring(z.read('xl/metadata.xml'))
            for idx, rc in enumerate(metadata.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}rc'), 1):
                vm_to_rv[idx] = int(rc.attrib.get('v', 0))
        except Exception as e:
            pass
            
        rv_to_relIdx = {}
        try:
            rv_xml = ET.fromstring(z.read('xl/richData/rdrichvalue.xml'))
            for idx, rv in enumerate(rv_xml.iter('{http://schemas.microsoft.com/office/spreadsheetml/2017/richdata}rv')):
                v = rv.find('{http://schemas.microsoft.com/office/spreadsheetml/2017/richdata}v')
                if v is not None:
                    rv_to_relIdx[idx] = int(v.text)
        except Exception as e:
            pass
                
        relIdx_to_rId = {}
        try:
            rvRel_xml = ET.fromstring(z.read('xl/richData/richValueRel.xml'))
            for idx, rel in enumerate(rvRel_xml.iter('{http://schemas.microsoft.com/office/spreadsheetml/2022/richvaluerel}rel')):
                relIdx_to_rId[idx] = rel.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        except Exception as e:
            pass
            
        rId_to_media = {}
        try:
            rels_xml = ET.fromstring(z.read('xl/richData/_rels/richValueRel.xml.rels'))
            for rel in rels_xml.iter('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                target = rel.attrib.get('Target')
                if target.startswith('../'):
                    target = 'xl/' + target[3:]
                rId_to_media[rel.attrib.get('Id')] = target
        except Exception as e:
            pass
            
        for row, member_id in row_id_map.items():
            if row == 1: continue
            
            name = row_name_map.get(row)
            avatar_url = None
            out_filepath = None
            
            vm = row_vm_map.get(row)
            if vm is not None and vm in vm_to_rv:
                rv_idx = vm_to_rv[vm]
                if rv_idx in rv_to_relIdx:
                    rel_idx = rv_to_relIdx[rv_idx]
                    if rel_idx in relIdx_to_rId:
                        rId = relIdx_to_rId[rel_idx]
                        if rId in rId_to_media:
                            media_path = rId_to_media[rId]
                            
                            media_bytes = z.read(media_path)
                            image = Image.open(io.BytesIO(media_bytes))
                            
                            w, h = image.size
                            side = min(w, h)
                            left = (w - side) // 2
                            top = (h - side) // 2
                            right = left + side
                            bottom = top + side
                            
                            image = image.crop((left, top, right, bottom))
                            image = image.resize((256, 256), Image.Resampling.LANCZOS)
                            if image.mode != 'RGB':
                                image = image.convert('RGB')
                                
                            out_filename = f'{team_prefix}_{member_id}.jpg'
                            out_filepath = os.path.join(UPLOADS_DIR, out_filename)
                            image.save(out_filepath)
                            
                            # Note: Not setting avatar_url here because we will upload to S3 in Node
                            avatar_url = out_filepath
                            print(f'  - Extracted image for {name}')
                            
            all_updates.append({
                'member_id': member_id,
                'name': name,
                'local_image': out_filepath
            })

with open('excel_updates_all.json', 'w', encoding='utf-8') as f:
    json.dump(all_updates, f, ensure_ascii=False, indent=2)
    
print(f'Saved excel_updates_all.json with {len(all_updates)} records.')
