# three-ios-bug-display

This repository is used to display a weird bug on iOS discovered while developing our software.
You can find a demo at https://maximeq.github.io/three-ios-bug-display/

## Overview
The main script has a useless line of code in a shader at line 50 :

    "   vec4 worldSpacePosition2 = modelMatrix * vec4( position, 1. );"

If this line is removed, the result is not the same as if the line is present. 

This only happens on iOS devices. 

## Details

This bug was discovered while working with [three.js](https://threejs.org/) (revision 101), a WebGL API. 
Weird issues arose when testing our code on iOS (on both Safari and Chrome), and while debugging we were 
able to extract the bug presented in the demo. This bug was confirmed on iOS devices only, which lead us
suspect this issue is linked to this specific platform.

This bug is a weird one : it is deterministic (it happens every single time with the same context) and yet, 
slight changes in the context may resolve the issue. By slight changes we mean:
- changing fragment shader uniform names
- not calling a specific uniform
- adding or removing a single line of code in a shader different than the one where the issue happens, 
  this line of code having literally no algorithmic impact on the code (useless line)
- changing the way the shadow map depth materials are applied
- basically, some changes that give an equivalent code


## FAQ


### If this bug is so circumstantial, why aren't you using a workaround ?

This is a very small part of our end product, which features a lot more moving parts, and we end up with strange 
artifacts that only appear on iOS. 
Our bug tracking has lead us to believe that our overall artifact issue is linked to this specific bug.


### What is the demo supposed to show ?

In our example, the shaders should allow us to see a position map of our mesh. However, due to our weird iOS bug, 
one of the examples will show the mesh with a normal map instead of a position map. 


### I don't see a difference between the two examples, why ?

If you're not on an iOS device, there should not be any difference indeed, because the code of the two pages is 
completely equivalent.

But if you are on iOS and don't see the bug, can you please drop a message with your exact device reference ?


### What devices have confirmed this issue on ?

- iPhone SE: bug confirmed
- iPhone X: bug confirmed
- iPad 2nd gen : no WebGL support
- iPad Pro 3rd gen: bug confirmed

On iPhone Xs with iOS 13 it seems to work.
