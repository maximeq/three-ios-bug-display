# three-ios-bug-display

This repositery is used to display a weird bug on iOS uncovered while developing our software.
You can find a demo at https://maximeq.github.io/three-ios-bug-display/


## Details

This bug was discovered while working with [three.js](https://threejs.org/) (revision 101), a WebGL API. 
Weird issues arose when testing our code on iOS (on both Safari and Chrome), and while debugging we were 
able to extract the bug presented in the demo. This bug was confirmed on iOS devices only, which lead to us
suspecting that this issue was linked to this specific platform.

This bug is a weird one, in that it is deterministic (it happens every single time with the same context) and yet, 
slight changes in the context will resolve the issue. By slight changes we mean:
- changing fragment shader uniform names
- not calling a specific uniform
- adding or removing a single line of code in a shader different than the one where the issue happens, 
  this line of code having litterally no algorithmic impact on the code (this line has no use)
- changing the way the shadow map depth materials are applied
- basically, some changes that give an equivalent code


## FAQ


### What is the demo supposed to show ?

In our example, the shaders should allow us to see a position map of our mesh. However, due to our weird iOS bug, 
one of the examples will show th e mesh with a normal map instead of a position map. 


### I don't see a difference between the two examples, why ?

If you're not on an iOS device, it's supposed not to have any difference, beacause the code of the two pages is 
completely equivalent.

But if you are on iOS, well it's good news, because it means that this bug was somehow resolved, or that your 
specific device doesn't have that bug.


### What devices have confirmed this issue on ?

- iPhone SE: bug confirmed
- iPhone X: bug confirmed
- iPad 2nd gen : no WebGL support
- iPad Pro 3rd gen: bug confirmed
