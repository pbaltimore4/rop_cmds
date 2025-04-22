#!/usr/local/bin/node

const pdf = require('pdf-parse');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function main(){

  try {

    // read cmd file
    const cmdFile = path.join(__dirname, 'inputs/cmd.txt');
    const cmds = await readLines(cmdFile);

    // read tlm file
    const tlmFile = path.join(__dirname, 'inputs/tlm.txt');
    const tlms = await readLines(tlmFile);

    // get list of rops
    const pdfFiles = glob.sync('inputs/rops/*.pdf', {});
    console.log(pdfFiles);

    // process all of the files
    results = [] 
    var cnt = 0
    for (const pdfFile of pdfFiles) {
      cnt++;
      console.log(`\nFile ${cnt} of ${pdfFiles.length} : ${pdfFile}`);
      var result = await processFile(pdfFile, cmds);
      results.push(...result);
    }

    // write the output
    var outFile = path.join(__dirname, 'outputs/rop_cmds.txt');
    await writeOut(outFile, results.join('\n'));
    
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function processFile(pdfFile, cmds){
  const pattern = /[A-Z0-9_]{4,45}/g;
  const basename = path.basename(pdfFile);
  const { filename, rev, ropid, name } = parse_rop_name(basename);
  try {
    var data = await pdf(pdfFile);
  } catch(err) {
    console.error('Error proccessing files:', err);
    throw err;
  }

  let results = [];
  const matches = data.text.matchAll(pattern);
  for (const match of matches) {
    if (cmds.includes(match[0])){
      if (!results.includes(ropid + ',' + basename + ',' + rev + ',' + match[0])){
        console.log(match[0]);
        results.push(ropid + ',' + basename + ',' + rev + ',' + match[0]);
      }
    }    
  }
  return results;
}

async function readLines(filename) {
  try {
    const data = await fsPromises.readFile(filename, { encoding: 'utf8' });
    const lines = data.split('\n');
    console.log(`Read ${lines.length} from ${filename}`);
    return lines;
  } catch (err) {
    console.error(err);
  }
}

async function writeOut(filename, data) {
  try{
    await fsPromises.writeFile(filename, data );
    console.log(`File ${filename} written successfully`);
  } catch (error) {
    console.error('Error writing file:', error);
  }
}

async function rm(filename) {
  try{
    await fsPromises.unlink(filename);
    console.log(`File ${filename} deleted successfully`);
  } catch (error) {
    if (error.code === 'ENOENT'){
    } else {
      console.error('Error deleting file:', error);
    }
  }
}

function parse_rop_name(filename){
  const pattern = /.*\d+.*REV\s+(\w{1}).*(ROP[-_]\w{1}[-_]\d{3})_*\s*(.*)_PPR.*\.pdf/;

  const matches = filename.match(pattern);
  const fname = matches[0];
  const rev = matches[1];
  const ropid = matches[2];
  const name = matches[3];
  //console.log(matches);
  return { fname, rev, ropid, name };
}

/*--------------- main routine --------------*/

main();

