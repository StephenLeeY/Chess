class JavascriptToolbox {
  arrays_equal(arr1, arr2) {
    if (arr1 === arr2) return true;
    if (arr1 == null || arr2 == null) return false;
    if (arr1.length !== arr2.length) return false;

    for(let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  array_remove(arr, from, to) {
    var rest = arr.slice((to || from) + 1 || arr.length);
    arr.length = from < 0 ? arr.length + from : from;
    arr.push.apply(arr, rest);
  }

  array_add(arr1, arr2) {
    if (arr1 == null || arr2 == null) return null;
    if (arr1.length !== arr2.length) return null;

    let arr3 = [];
    for(let i = 0; i < arr1.length; i++) {
      arr3.push(arr1[i] + arr2[i]);
    }
    return arr3;
  }
}
