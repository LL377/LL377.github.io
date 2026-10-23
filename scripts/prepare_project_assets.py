"""Prepare the latest complete portfolios without applying legacy crop bounds."""
from pathlib import Path
from PIL import Image
import json
Image.MAX_IMAGE_PIXELS=None
root=Path(__file__).resolve().parents[1]
p=json.loads((root/'content/profile.json').read_text())
source=Path('/Users/lelao/Documents/奥创/作品集网站/作品集素材整理')
for i,(slug,name) in enumerate([('mogu','高保真10.10.png'),('dedao','4.0.png')]):
 original=Image.open(source/name).convert('RGBA')
 im=Image.new('RGB',original.size,'white')
 im.paste(original,mask=original.getchannel('A'))
 out=root/'assets/profile'/slug;out.mkdir(exist_ok=True)
 im.save(out/'complete.jpg',quality=95,subsampling=0)
 cover=im.crop((0,0,im.width,round(im.width*.85)))
 cover.save(out/'cover.jpg',quality=95)
 media=[]
 for n,y in enumerate(range(0,im.height,2200)):
  tile=im.crop((0,y,im.width,min(y+2200,im.height)))
  filename=f'part-{n+1:02}.jpg';tile.save(out/filename,quality=95,subsampling=0)
  media.append({'type':'image','url':f'/assets/profile/{slug}/{filename}','alt':f'{p["projects"][i]["name"]}作品集 · 第{n+1}段','width':tile.width,'height':tile.height})
 v=p['projects'][i];v.update(presentation='case-study',cover={'type':'image','url':f'/assets/profile/{slug}/cover.jpg','alt':v['title'],'position':'50% 0%'},media=media,link=f'/assets/profile/{slug}/complete.jpg',linkLabel='查看完整高清长图 ↗')
 print(slug,im.size,len(media),'segments',sum(m['height'] for m in media))
(root/'content/profile.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
