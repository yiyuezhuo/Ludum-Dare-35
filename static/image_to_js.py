# -*- coding: utf-8 -*-
"""
Created on Mon Apr 18 05:05:10 2016

@author: yiyuezhuo
"""

from PIL import Image
import numpy as np
from itertools import chain
from collections import Counter
import jinja2

class Scale(object):
    def __init__(self,domain,_range):
        self.domain=domain
        self.range=_range
        self.k=(_range[1]-_range[0])/(domain[1]-domain[0])
        self.b=_range[0]-domain[0]*self.k
    def __call__(self,x):
        return self.k*x+self.b
        
def get_mat(im):
    mat=[]
    for i in range(im.size[0]):
        row=[]
        for j in range(im.size[1]):
            row.append(im.getpixel((i,j)))
        mat.append(row)
    return mat
    
def to_js(fname,low=-3,high=3,template_file='template.js'):
    name,suffix=fname.split('.')
    im=Image.open(fname).convert('1')
    mat=np.array(get_mat(im))
    d1=np.argwhere(np.diff(mat.all(axis=1)))
    d1min=np.min(d1)
    d1max=np.max(d1)
    d2=np.argwhere(np.diff(mat.all(axis=0)))
    d2min=np.min(d2)
    d2max=np.max(d2)
    d1_scale=Scale([d1min,d1max],[low,high])
    d2_scale=Scale([d2min,d2max],[high,low])
    l=[]
    for i in range(mat.shape[0]):
        for j in range(mat.shape[1]):
            if mat[(i,j)]==0:
                l.append([d1_scale(i),d2_scale(j)])
    with open(template_file) as f:
        s=f.read()
        template=jinja2.Template(s)
    ss=template.render(name=name+'Graph',point_list=l)
    with open(name+'.js','w') as f:
        f.write(ss)
    

        
        
#xScale=scale([0,206],[-5,5])
#yScale=scale([0,195],[-5,5])