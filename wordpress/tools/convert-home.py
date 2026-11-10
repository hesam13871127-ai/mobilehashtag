"""One-time source-to-template conversion. Does not modify the approved source."""
from pathlib import Path
from bs4 import BeautifulSoup
import json
ROOT=Path(__file__).resolve().parents[2]
THEME=ROOT/'wordpress/theme/mobile-hashtag'
soup=BeautifulSoup((ROOT/'frontend/index.html').read_text(),'html.parser')
main=soup.find('main');tokens={}
def php(code):
 key='MHTPHPTOKEN'+str(len(tokens))+'END';tokens[key]='<?php '+code+' ?>';return key
# Preserve layout markup and only replace functional data/URLs.
for tag in main.find_all(attrs={'href':True}):
 link=tag['href']
 if '.html' in link:tag['href']=php('echo esc_url(mht_url('+repr(link)+'));')
for tag in main.find_all(attrs={'data-icon':True}):
 tag.clear();tag.append(php('echo mht_icon('+repr(tag['data-icon'])+');'));del tag['data-icon']
for tag in main.find_all('button',attrs={'data-phone-brand':True}):
 brand=tag['data-phone-brand'];tag.name='a';tag['href']=php("echo esc_url(add_query_arg('phone_brand', "+repr(brand)+", home_url('/')) . '#popular-section');")
 tag['class']=php("echo sanitize_text_field(wp_unslash($_GET['phone_brand'] ?? '')) === "+repr(brand)+" ? 'chip active' : 'chip';")
 del tag['data-phone-brand']
queries={
 'popular-products':"mht_home_products('phones',4,'popular');",
 'sale-products':"mht_home_products('accessories',4,'sale');",
 'bestselling-products':"mht_home_products('accessories',8,'bestselling');",
 'accessory-products':"mht_home_products('accessories',4,'price');",
 'new-products':"mht_home_products('',8,'newest');",
 'gadget-products':"mht_home_products('gadgets',4,'featured');",
 'home-categories':'mht_home_categories();',
 'brand-list':'mht_brands();',
 'home-posts':"foreach(get_posts(['numberposts'=>3,'post_status'=>'publish']) as $article){mht_post_card($article);}",
}
for id,code in queries.items():
 tag=main.find(id=id)
 if not tag:raise ValueError('Missing slot '+id)
 tag.clear();tag.append(php(code))
contact=main.find(id='home-contact');contact.append(php("if(function_exists('mhc_contact_block')){echo '<div class=\"contact-band-details\">'.mhc_contact_block().'</div>'; }"))
# Customizer-controlled section visibility and titles, derived from the original DOM.
sections={}
for i,section in enumerate(main.select('.home > section')):
 key='section_'+str(i);title=section.find(['h2','h1','h3']);label=title.get_text(' ',strip=True) if title else 'مزایای خرید'
 sections[key]=label
 if title and title.name=='h2':
  original=title.decode_contents();title.clear();title.append(php("if(get_theme_mod('mht_"+key+"_title')): echo esc_html(get_theme_mod('mht_"+key+"_title')); else: ?>"+original+"<?php endif;"))
 section.insert_before(php("if(get_theme_mod('mht_"+key+"_visible',true)):"));section.insert_after(php('endif;'))
# Images/links for every source banner are editable without altering the CSS composition.
banners={}
for i,tag in enumerate(main.select('.promo, .wide-campaign, .speaker-campaign')):
 key='banner_'+str(i);banners[key]=tag.find(['h2','h3']).get_text(' ',strip=True)
 tag['style']=php("echo esc_attr(mht_banner_style('"+key+"'));")
 link=tag if tag.name=='a' else tag.find('a')
 if link:
  original=tokens.get(link['href'],'')
  if original:
   expression=original.removeprefix('<?php echo esc_url(').removesuffix('); ?>')
   link['href']=php("echo esc_url(get_theme_mod('mht_"+key+"_link',"+expression+"));")
# Hero markup remains; escaped slide JSON drives the source interactions.
hero=main.find(class_='hero');hero['data-slides']=php('echo esc_attr(wp_json_encode(mht_slides(),JSON_UNESCAPED_UNICODE));')
hero['style']=php("echo esc_attr(mht_banner_style('hero_0'));")
html=str(main)
for _ in range(3):
 for key,value in tokens.items():html=html.replace(key,value)
import re
sections={k:re.sub(r'MHTPHPTOKEN\d+END', '', v).strip() for k,v in sections.items()}
banners['banner_3']='کمپین صدا';banners['banner_6']='کمپین اسپیکر'
(THEME/'front-page.php').write_text("<?php get_header(); ?>\n"+html+"\n<?php get_footer(); ?>\n")
(THEME/'inc/home-sections.json').write_text(json.dumps({'sections':sections,'banners':banners},ensure_ascii=False,indent=2))
print('Preserved sections',len(sections),'editable campaign banners',len(banners))
