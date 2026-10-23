"""Map approved resume content onto the retained reference layout."""
import json,pathlib,re,shutil,html as escape_html
from lxml import html,etree
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=json.loads((ROOT/'content/profile.json').read_text())
def elements(tree,cls):return tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," '+cls+' ")]')
def set_text(e,text):
 for child in list(e): e.remove(child)
 e.text=text
page=html.fromstring((ROOT/'reference/local-base.html').read_text())
page.set('lang','zh-CN')
page.find('.//title').text='劳乐 LAO LE | UX / Interaction Designer'
for meta in page.xpath('//meta[@property="og:title" or @property="og:site_name"]'):meta.set('content','劳乐 LAO LE | UX / Interaction Designer')
for meta in page.xpath('//meta[@property="og:description" or @name="description"]'):meta.set('content',p['intro'])
for meta in page.xpath('//meta[@property="og:image"]'):meta.set('content',p['projects'][0].get('cover',{}).get('url',p['projects'][0]['placeholder']))
for anchor in page.xpath('//a[starts-with(@href,"mailto:")]'):
 anchor.set('href','mailto:'+p['email'])
 for node in anchor.iter():
  if node.text and 'h2009210@gmail.com' in node.text:node.text=node.text.replace('h2009210@gmail.com',p['email'])
for anchor in page.xpath('//a[contains(@href,"instagram.com") or contains(@href,"linkedin.com")]'):anchor.getparent().remove(anchor)
for node in page.iter():
 if node.text:
  for old,new in [('NING HUANG','LAO LE'),("Portfolio'25","Portfolio'26"),("I'm a digital designer based in Melbourne, AU",'LAO LE · UX / INTERACTION DESIGNER'),('Focused on web experience & motion design.','FOCUSED ON PRODUCT EXPERIENCE & UI DESIGN.'),('Mixing interactions, code, & imagination','UI / UX · INTERACTION · VISUAL DESIGN'),('I love Design & Motion','I explore Product & Interaction'),('And bring ideas to life with Vibe coding','From user needs to thoughtful experiences')]:node.text=node.text.replace(old,new)
# Replace original name SVG with editable text; include it in the existing entry animation.
name_wrap=elements(page,'title-wrap')[0]
for child in list(name_wrap):name_wrap.remove(child)
name_svg=etree.fromstring(b'<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="300" viewBox="0 0 840 150" role="img" aria-label="LAO LE 2026"><text x="0" y="132" fill="var(--white)" font-family="PP Neue Montreal,Arial,sans-serif" font-size="174" font-weight="400" letter-spacing="-9">LAO LE<tspan font-family="PP Eiko,Georgia,serif" font-style="italic" font-size="159">\xe2\x80\x9926</tspan></text></svg>')
name_wrap.append(name_svg)
intro=elements(page,'intro-wrap')[0].find('.//h4')
set_text(intro,'从用户需求出发，梳理清晰的交互路径，让产品体验与视觉表达相互成就。')
about=elements(page,'about_contain')[0]
set_text(about.find('span'),p['intro'])
info=elements(page,'about-info')[0]
for child in list(info):info.remove(child)
sections=[('实习经历 / EXPERIENCE',[
 ('北京得到信息科技有限公司 · 2026.06–2026.09','参与知识类 APP 运营活动设计，负责活动页面、图标及视觉素材制作，结合 AIGC 辅助方案探索与视觉交付。'),
 ('上海朔羡网络科技有限公司 · 2026.01–2026.03','参与租房类 APP 产品体验优化，开展界面设计、信息层级梳理、视觉规范优化及高保真界面与组件搭建。')]),
 ('教育背景 / EDUCATION',[('厦门理工大学 · 2023.09–至今','数字媒体艺术设计 · 交互设计方向')]),
 ('荣誉 / RECOGNITION',[(x,'') for x in ['校一等奖学金','专业综合成绩排名前 4%','未来设计师大赛二等奖','4C 大赛三等奖']])]
for title,items in sections:
 block=etree.SubElement(info,'div',{'class':'brxe-div'})
 etree.SubElement(block,'h6',{'class':'brxe-heading'}).text=title
 ul=etree.SubElement(block,'ul',{'class':'brxe-div'})
 for label,detail in items:
  li=etree.SubElement(ul,'li',{'class':'brxe-text-basic'});li.text=label
  if detail:etree.SubElement(li,'p',{'class':'resume-detail'}).text=detail
for heading,text in zip(elements(page,'service-wrap')[0].findall('h3'),['UI / UX Design','Interaction Design','Visual Design','Design Systems','AIGC Exploration']):set_text(heading,text)
# Neutral text-only placeholders; no reference projects are attributed to the user.
for idx,project in enumerate(p['projects']):
 bg=['#dcded7','#e4dace','#d9dfe5','#e1dfcb','#dedbe5'][idx % 5]
 category={'work':'SELECTED WORK','life':'LIFE JOURNAL','placeholder':'COMING SOON'}[project.get('kind','work')]
 placeholder_label=escape_html.escape(project.get('placeholderLabel','素材待补充'))
 label=escape_html.escape(project['name'])
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><rect width="1600" height="1200" fill="{bg}"/><text x="95" y="110" font-family="Arial,sans-serif" font-size="30" fill="#555">LAO LE / {category} 0{idx+1}</text><text x="95" y="590" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="94" fill="#202020">{label}</text><text x="95" y="680" font-family="Arial,sans-serif" font-size="30" fill="#555">{project["date"]}</text><path d="M95 985H1505" stroke="#777"/><text x="95" y="1060" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="30" fill="#555">{placeholder_label}</text></svg>'
 (ROOT/project['placeholder'].lstrip('/')).write_text(svg)
cards=elements(page,'card')
for i,card in enumerate(cards):
 if i>=len(p['projects']):card.getparent().remove(card);continue
 project=p['projects'][i];set_text(card.find('.//h2'),project['title'])
 desc=card.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," card-description ")]/p')[0];set_text(desc,project['summary'])
 card.set('data-project',project['id'])
 card.set('data-cursor','查看项目' if project.get('kind')=='work' else '查看内容')
# Replace every remaining reference portfolio image/video, preserving animated wrappers.
for i,image in enumerate(page.xpath('//img')):
 project=p['projects'][i%len(p['projects'])]
 ancestor=next((a for a in image.iterancestors() if 'card' in a.get('class','').split()),None)
 if ancestor is not None:project=p['projects'][elements(page,'card').index(ancestor)]
 for attr in list(image.attrib):
  if attr in ['srcset','sizes','data-srcset','data-src','data-sizes','width','height']:del image.attrib[attr]
 cover=project.get('cover',{'url':project['placeholder'],'alt':project['title']+'，素材待补充'})
 image.set('src',cover['url']);image.set('alt',cover['alt'])
 if cover.get('position'):image.set('style','object-position:'+cover['position'])
 if ancestor is not None:image.set('loading','lazy')
for video in page.xpath('//video'):
 replacement=etree.Element('img',{'src':p['projects'][0]['placeholder'],'alt':'作品混剪素材待补充'})
 video.getparent().replace(video,replacement)
# Use personal photographs only in non-project atmospheric areas.
if p.get('ambientPhotos'):
 photos=p['ambientPhotos']
 for cls in ['sm-cube','outro-img']:
  for group in elements(page,cls):
   for i,image in enumerate(group.findall('.//img')):
    image.set('src',photos[i%len(photos)]);image.set('alt','个人生活照片')
 # Preserve the six-face cube, with work placeholders on the project faces.
 cube=elements(page,'cube-1')[0]
 for cls,url in [('front',photos[0]),('back',photos[1]),('top',photos[2]),('bottom',photos[3])]:
  face=cube.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," '+cls+' ")]')[0]
  image=face.find('img')
  if image is not None:image.set('src',url);image.set('alt','个人生活照片')
if p.get('aboutPortrait'):
 portrait=p['aboutPortrait']
 wrapper=etree.Element('div',{'class':'about-introduction'})
 introduction=about.find('span');about.replace(introduction,wrapper)
 wrapper.append(introduction)
 figure=etree.SubElement(wrapper,'figure',{'class':'about-portrait'})
 etree.SubElement(figure,'img',{'src':portrait['url'],'alt':portrait['alt'],'loading':'lazy'})
 etree.SubElement(figure,'figcaption').text='LAO LE / BEYOND DESIGN'
for node in elements(page,'footer-info-txt')[0].findall('p'):
 if node.text and 'Ning Huang' in node.text:
  set_text(node,'LAO LE · UX / INTERACTION DESIGNER')
# Preserve reference design attribution without misattributing the portfolio work.
footer=elements(page,'footer-info-txt')[0]
etree.SubElement(footer,'p',{'class':'brxe-text-basic design-credit'}).text='Website design reference: Ning Huang'
# Preserve both original draggable folders; replace the reference playlist with a local placeholder.
for folder in elements(page,'playlist'):
 for label in folder.findall('p'):set_text(label,'生活片段')
cv=etree.SubElement(footer,'a',{'href':'/assets/profile/lao-le-resume.pdf','target':'_blank','rel':'noopener','class':'brxe-div info-txt'})
cv.text='CV ↗'
for script in page.xpath('//script[@src]'):
 if 'projectsData.js' in script.get('src'):script.set('src','/assets/profile/projects.js')
for script in page.xpath('//script[not(@src)]'):
 if script.text and 'textArray' in script.text:
  script.text=re.sub(r'const textArray = \[.*?\];','const textArray = ["UI / UX", "Interaction", "Product Experience", "Visual Design", "AIGC Exploration", "LAO LE"];',script.text)
for heading in elements(page,'sticky-header')[0].findall('h1'):set_text(heading,'Selected work & life')
for label in elements(page,'desc-wrap')[0].xpath('./span/p[last()]'):set_text(label,'/Selected work & life')
etree.SubElement(page.find('head'),'link',{'rel':'stylesheet','href':'/assets/profile/profile.css'})
text=html.tostring(page,encoding='unicode',doctype='<!DOCTYPE html>')
(ROOT/'index.html').write_text(text)
projects={v['id']:{'title':v['title'],'description':v['description'],'cover':v.get('cover',{'type':'image','url':v['placeholder'],'alt':v['title']+'，素材待补充'}),'media':v.get('media',[]),**{key:v[key] for key in ['link','linkLabel','presentation'] if key in v}} for v in p['projects']}
(ROOT/'assets/profile/projects.js').write_text('window.projectsData = '+json.dumps(projects,ensure_ascii=False,indent=2)+';\n')
utility=ROOT/'assets/ning-h.com/wp-content/themes/ning25/js/utility.js'
u=utility.read_text().replace('/assets/ning-h.com/wp-content/uploads/2025/06/NingHuang_CV.pdf','/assets/profile/lao-le-resume.pdf')
u=u.replace("'https://getjuky.app/join/8NZ7V4'", 'null').replace("'mailto:"+p['email']+"'", 'null')
u=u.replace("'Join the Party :)'", "'生活片段 · 素材待补充'")
u=u.replace('if (link) eggModalLink = link;', "eggModalLink = link || null;\n        eggModalBtn.style.display = link ? '' : 'none';")
utility.write_text(u)
script=ROOT/'assets/ning-h.com/wp-content/themes/ning25/js/script.js'
s=script.read_text().replace("preloadTl.set('svg path',", "preloadTl.set('svg path, .title-wrap svg text',").replace("preloadTl.to('svg path',", "preloadTl.to('svg path, .title-wrap svg text',")
script.write_text(s)
import runpy
runpy.run_path(str(ROOT/'scripts/apply_media.py'),run_name='__main__')
shutil.copy2(ROOT/'index.html',ROOT/'dist/index.html')
shutil.copytree(ROOT/'assets',ROOT/'dist/assets',dirs_exist_ok=True)
print('Personalized: LAO LE; three cards (two projects and life journal), Mogu first; resume and email connected.')
